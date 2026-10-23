import { getRepo } from "../repo";
import { canTransitionPayment } from "../status";
import type { ProviderEvent } from "./provider";

export type WebhookOutcome = "duplicate" | "recorded" | "ignored_event" | "unknown_booking" | "amount_mismatch" | "currency_mismatch" | "not_awaiting";

/**
 * Applies a VERIFIED provider event. Idempotent on (provider, eventId).
 *
 * A successful provider payment moves the payment to "under review" and records
 * the provider reference; it does NOT mark it verified. An admin still confirms
 * it against the provider dashboard / bank settlement, because the database
 * requires verification evidence and an accountable person. Whether to
 * auto-verify is a decision for after a provider is chosen.
 */
export async function applyProviderEvent(providerName: string, ev: ProviderEvent): Promise<WebhookOutcome> {
  const repo = getRepo();
  const bookingId = await repo.getBookingIdByReference(ev.bookingReference);
  const first = await repo.recordPaymentEvent({ provider: providerName, event_id: ev.eventId, booking_id: bookingId, type: ev.type, amount_pkr: ev.amountPkr });
  if (!first) return "duplicate";

  const audit = (action: string, to: string, meta: Record<string, unknown> = {}) =>
    repo.appendAudit({ booking_id: bookingId, actor_id: null, actor_label: `provider:${providerName}`, action, from_value: null, to_value: to, meta: { eventId: ev.eventId, ...meta } });

  if (ev.type !== "payment.succeeded") {
    await audit("provider_event", ev.type);
    return "ignored_event";
  }
  if (!bookingId) return "unknown_booking";
  const detail = await repo.getBookingDetail(bookingId);
  if (!detail) return "unknown_booking";
  const { booking, payment } = detail;

  // Amount is checked against OUR record, never trusted from the payload alone.
  if (ev.currency.toUpperCase() !== "PKR") {
    await audit("provider_payment_rejected", "currency_mismatch", { currency: ev.currency });
    return "currency_mismatch";
  }
  if (ev.amountPkr !== payment.amount_pkr) {
    await audit("provider_payment_rejected", "amount_mismatch", { received: ev.amountPkr, due: payment.amount_pkr });
    return "amount_mismatch";
  }
  if (booking.status !== "awaiting_payment" || !canTransitionPayment(payment.status, "under_review")) {
    await audit("provider_payment_rejected", "not_awaiting", { bookingStatus: booking.status, paymentStatus: payment.status });
    return "not_awaiting";
  }

  await repo.updatePayment(payment.id, { status: "under_review", bank_reference: `${providerName}:${ev.providerPaymentId}` });
  await repo.setBookingStatus(booking.id, "payment_under_review");
  await audit("payment_status_changed", "under_review", { providerPaymentId: ev.providerPaymentId, amountPkr: ev.amountPkr });
  return "recorded";
}
