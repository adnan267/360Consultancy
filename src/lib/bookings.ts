import { sendNotification, type NotificationContext, type NotificationKind } from "./email";
import { servicesEnabled } from "./env";
import { calculatePayable } from "./pricing";
import { generateBookingReference } from "./reference";
import { getRepo, isDatabaseConfigured } from "./repo";
import { DuplicateReferenceError } from "./repo/types";
import { canTransitionBooking, canTransitionPayment } from "./status";
import type { Actor, BookingDetail, BookingStatus } from "./types";
import { bookingRequestSchema, preferredToIso, type AdminBookingAction } from "./validation";

export type Result<T> = ({ ok: true } & T) | { ok: false; status: number; error: string; fields?: Record<string, string[]> };
const fail = (status: number, error: string, fields?: Record<string, string[]>) => ({ ok: false as const, status, error, fields });

// ── Public: create a booking REQUEST ────────────────────────────────────────

export interface CreatedBooking {
  reference: string;
  currency: "PKR";
  consultancyFeePkr: number;
  governmentFeesPkr: 0;
  totalPayablePkr: number;
  isStartingPrice: boolean;
  status: "request_received";
}

export async function createBookingRequest(input: unknown, ctx: { ip: string }): Promise<Result<{ booking: CreatedBooking }>> {
  // Feature flag enforced server-side: nothing below runs while services are disabled.
  if (!servicesEnabled()) return fail(503, "Bookings are not open yet. Please check back soon.");
  if (!isDatabaseConfigured()) return fail(503, "Bookings are temporarily unavailable.");
  const repo = getRepo();

  if (!(await repo.hitRateLimit(`booking:ip:${ctx.ip}`, 5, 3600))) {
    return fail(429, "Too many requests. Please try again later.");
  }

  const parsed = bookingRequestSchema.safeParse(input);
  if (!parsed.success) {
    const fields: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      (fields[key] ??= []).push(issue.message);
    }
    return fail(422, "Please check the highlighted fields.", fields);
  }
  const v = parsed.data;

  // Honeypot: bots fill hidden fields. Pretend success, store nothing.
  if (v.website) {
    return { ok: true, booking: { reference: generateBookingReference(), currency: "PKR", consultancyFeePkr: 0, governmentFeesPkr: 0, totalPayablePkr: 0, isStartingPrice: false, status: "request_received" } };
  }

  if (!(await repo.hitRateLimit(`booking:email:${v.email}`, 3, 3600))) {
    return fail(429, "Too many requests for this email. Please try again later.");
  }

  const [service, country] = await Promise.all([repo.getServiceBySlug(v.serviceSlug), repo.getCountryBySlug(v.countrySlug)]);
  if (!service || !service.is_active) return fail(422, "That service is not currently available.", { serviceSlug: ["Please choose an available service"] });
  if (!country || !country.is_active) return fail(422, "That destination is not currently available.", { countrySlug: ["Please choose a destination"] });

  // PRICE COMES FROM THE DATABASE ONLY.
  const payable = calculatePayable(service);

  let created: Awaited<ReturnType<typeof repo.insertBooking>> | null = null;
  for (let attempt = 0; attempt < 5 && !created; attempt++) {
    try {
      created = await repo.insertBooking({
        reference: generateBookingReference(),
        full_name: v.fullName,
        email: v.email,
        phone: v.phone,
        country_id: country.id,
        service_id: service.id,
        preferred_at: preferredToIso(v.preferredDate, v.preferredTime),
        message: v.message,
        fee_pkr: payable.totalPayablePkr,
      });
    } catch (e) {
      if (!(e instanceof DuplicateReferenceError)) throw e;
    }
  }
  if (!created) return fail(500, "Could not create your request. Please try again.");

  const { booking } = created;
  await repo.appendAudit({
    booking_id: booking.id,
    actor_id: null,
    actor_label: "public",
    action: "booking_created",
    from_value: null,
    to_value: booking.status,
    meta: { feePkr: booking.fee_pkr, service: service.slug, country: country.slug },
  });

  await notify(booking.id, "booking_received", {
    reference: booking.reference,
    fullName: booking.full_name,
    email: booking.email,
    serviceTitle: service.title,
    feePkr: booking.fee_pkr,
    preferredAt: booking.preferred_at,
  });

  return {
    ok: true,
    booking: {
      reference: booking.reference,
      currency: "PKR",
      consultancyFeePkr: payable.consultancyFeePkr,
      governmentFeesPkr: 0,
      totalPayablePkr: payable.totalPayablePkr,
      isStartingPrice: payable.isStartingPrice,
      status: "request_received",
    },
  };
}

/** Attempts to send and records the real outcome. Never reports "sent" unless the provider did. */
async function notify(bookingId: string, kind: NotificationKind, ctx: NotificationContext) {
  const result = await sendNotification(kind, ctx);
  try {
    await getRepo().appendAudit({
      booking_id: bookingId,
      actor_id: null,
      actor_label: "system",
      action: "notification",
      from_value: null,
      to_value: kind,
      meta: { sent: result.sent, reason: result.reason ?? null },
    });
  } catch (e) {
    console.error("[audit] notification log failed", e);
  }
  return result;
}

function ctxOf(d: BookingDetail, status?: BookingStatus): NotificationContext {
  return {
    reference: d.booking.reference,
    fullName: d.booking.full_name,
    email: d.booking.email,
    serviceTitle: d.service.title,
    feePkr: d.booking.fee_pkr,
    preferredAt: d.booking.preferred_at,
    status,
  };
}

// ── Admin: apply an action to a booking ─────────────────────────────────────

export async function applyAdminAction(bookingId: string, action: AdminBookingAction, actor: Actor): Promise<Result<{ detail: BookingDetail }>> {
  const repo = getRepo();
  const detail = await repo.getBookingDetail(bookingId);
  if (!detail) return fail(404, "Booking not found");
  const { booking, payment } = detail;

  switch (action.action) {
    case "add_note": {
      await repo.appendAudit({ booking_id: booking.id, actor_id: actor.id, actor_label: actor.label, action: "note_added", from_value: null, to_value: null, meta: { note: action.note } });
      break;
    }

    case "set_status": {
      const to = action.status;
      if (!canTransitionBooking(booking.status, to)) return fail(409, `Cannot move a booking from "${booking.status}" to "${to}".`);
      // These two moves are driven by recording the payment, so the payment record and the booking can never disagree.
      if (to === "payment_under_review") return fail(409, "Record the payment as 'under review' instead; the booking status follows automatically.");
      if (booking.status === "payment_under_review" && to === "awaiting_payment") return fail(409, "Reject the payment instead; the booking returns to 'awaiting payment' automatically.");
      if (["confirmed", "in_progress", "completed"].includes(to) && payment.status !== "verified") {
        return fail(409, "The payment must be verified against the bank record before this booking can be confirmed.");
      }
      await repo.setBookingStatus(booking.id, to);
      await repo.appendAudit({ booking_id: booking.id, actor_id: actor.id, actor_label: actor.label, action: "booking_status_changed", from_value: booking.status, to_value: to, meta: action.note ? { note: action.note } : {} });

      const kind: NotificationKind | null = to === "awaiting_payment" ? "payment_instructions" : to === "confirmed" ? "appointment_confirmed" : to === "cancelled" ? "status_updated" : null;
      if (kind) await notify(booking.id, kind, ctxOf(detail, to));
      break;
    }

    case "update_payment": {
      const to = action.status;
      if (!canTransitionPayment(payment.status, to)) return fail(409, `Cannot move a payment from "${payment.status}" to "${to}".`);

      if (to === "under_review") {
        if (booking.status !== "awaiting_payment") return fail(409, "Accept the request (set 'awaiting payment') before recording a payment.");
        await repo.updatePayment(payment.id, { status: "under_review", bank_reference: action.bankReference ?? payment.bank_reference });
        await repo.setBookingStatus(booking.id, "payment_under_review");
        await repo.appendAudit({ booking_id: booking.id, actor_id: actor.id, actor_label: actor.label, action: "booking_status_changed", from_value: booking.status, to_value: "payment_under_review", meta: { via: "payment" } });
      }

      if (to === "verified") {
        // Verification must rest on the actual bank record, never on a customer's screenshot.
        if (!action.bankReference || action.receivedAmountPkr === undefined) {
          return fail(422, "Enter the bank transaction reference and the amount actually received in the bank account.");
        }
        if (action.receivedAmountPkr !== payment.amount_pkr) {
          return fail(422, `Amount received (${action.receivedAmountPkr}) does not match the amount due (${payment.amount_pkr}). Leave the payment under review and resolve the difference first.`);
        }
        await repo.updatePayment(payment.id, {
          status: "verified",
          bank_reference: action.bankReference,
          received_amount_pkr: action.receivedAmountPkr,
          verified_by: actor.id,
          verified_at: new Date().toISOString(),
        });
        await notify(booking.id, "payment_verified", ctxOf(detail));
      }

      if (to === "rejected") {
        if (!action.note) return fail(422, "A reason is required when rejecting a payment.");
        await repo.updatePayment(payment.id, { status: "rejected" });
        await repo.setBookingStatus(booking.id, "awaiting_payment");
        await repo.appendAudit({ booking_id: booking.id, actor_id: actor.id, actor_label: actor.label, action: "booking_status_changed", from_value: booking.status, to_value: "awaiting_payment", meta: { via: "payment_rejected" } });
      }

      if (to === "refunded") {
        if (booking.status !== "cancelled") return fail(409, "Cancel the booking before recording a refund.");
        await repo.updatePayment(payment.id, { status: "refunded" });
      }

      await repo.appendAudit({
        booking_id: booking.id,
        actor_id: actor.id,
        actor_label: actor.label,
        action: "payment_status_changed",
        from_value: payment.status,
        to_value: to,
        meta: { bankReference: action.bankReference ?? null, receivedAmountPkr: action.receivedAmountPkr ?? null, ...(action.note ? { note: action.note } : {}) },
      });
      break;
    }
  }

  const updated = await repo.getBookingDetail(bookingId);
  return { ok: true, detail: updated! };
}
