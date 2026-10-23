import { beforeEach, describe, expect, it } from "vitest";
import { applyAdminAction, createBookingRequest } from "@/lib/bookings";
import type { Actor } from "@/lib/types";
import type { MemoryRepo } from "@/lib/repo";
import { captureEmail, freshRepo, validBooking, type CapturingEmail } from "./helpers";

let repo: MemoryRepo;
let mail: CapturingEmail;
const admin: Actor = { id: "11111111-1111-4111-8111-111111111111", label: "admin@example.com", role: "admin" };
let id: string;

beforeEach(async () => {
  repo = freshRepo();
  mail = captureEmail();
  process.env.SERVICES_ENABLED = "true";
  await createBookingRequest(validBooking(), { ip: "9.9.9.9" });
  id = repo.bookings[0]!.id;
  mail.sent.length = 0;
});

const status = (s: string, note?: string) => applyAdminAction(id, { action: "set_status", status: s as never, note }, admin);
const pay = (a: Record<string, unknown>) => applyAdminAction(id, { action: "update_payment", ...a } as never, admin);

describe("payment verification is auditable and evidence-based", () => {
  it("full happy path with audit trail", async () => {
    expect((await status("awaiting_payment")).ok).toBe(true);
    expect(mail.sent.at(-1)!.subject).toMatch(/Payment instructions/);
    expect(mail.sent.at(-1)!.text).toContain(repo.bookings[0]!.reference);

    expect((await pay({ status: "under_review", bankReference: "TXN-1001" })).ok).toBe(true);
    expect(repo.bookings[0]!.status).toBe("payment_under_review");

    const v = await pay({ status: "verified", bankReference: "TXN-1001", receivedAmountPkr: 1500 });
    expect(v.ok).toBe(true);
    expect(repo.payments[0]).toMatchObject({ status: "verified", verified_by: admin.id, received_amount_pkr: 1500, bank_reference: "TXN-1001" });
    expect(repo.payments[0]!.verified_at).toBeTruthy();

    expect((await status("confirmed")).ok).toBe(true);
    expect(mail.sent.at(-1)!.subject).toMatch(/Booking confirmed/);

    const pa = repo.audit.find((a) => a.action === "payment_status_changed" && a.to_value === "verified")!;
    expect(pa).toMatchObject({ from_value: "under_review", actor_label: admin.label });
    expect(pa.meta).toMatchObject({ bankReference: "TXN-1001", receivedAmountPkr: 1500 });
  });

  it("cannot confirm without a verified payment", async () => {
    await status("awaiting_payment");
    const r = await status("confirmed");
    expect(r.ok).toBe(false);
    // Not even via a skipped step
    expect((await status("payment_under_review")).ok).toBe(false);
  });

  it("cannot verify without bank reference and received amount", async () => {
    await status("awaiting_payment");
    await pay({ status: "under_review" });
    const r = await pay({ status: "verified" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(422);
    expect(repo.payments[0]!.status).toBe("under_review");
  });

  it("rejects an amount mismatch", async () => {
    await status("awaiting_payment");
    await pay({ status: "under_review" });
    const r = await pay({ status: "verified", bankReference: "TXN-2", receivedAmountPkr: 1000 });
    expect(r.ok).toBe(false);
    expect(repo.payments[0]!.status).toBe("under_review");
  });

  it("cannot skip straight to verified or record payment before acceptance", async () => {
    expect((await pay({ status: "verified", bankReference: "X1X", receivedAmountPkr: 1500 })).ok).toBe(false);
    expect((await pay({ status: "under_review" })).ok).toBe(false); // still request_received
  });

  it("rejection needs a reason and returns booking to awaiting_payment", async () => {
    await status("awaiting_payment");
    await pay({ status: "under_review" });
    expect((await pay({ status: "rejected" })).ok).toBe(false);
    expect((await pay({ status: "rejected", note: "No matching credit" })).ok).toBe(true);
    expect(repo.bookings[0]!.status).toBe("awaiting_payment");
    expect(repo.payments[0]!.status).toBe("rejected");
  });

  it("refund only after cancellation, and is logged", async () => {
    await status("awaiting_payment");
    await pay({ status: "under_review" });
    await pay({ status: "verified", bankReference: "TXN-3", receivedAmountPkr: 1500 });
    expect((await pay({ status: "refunded" })).ok).toBe(false);
    expect((await status("cancelled", "Customer request")).ok).toBe(true);
    expect((await pay({ status: "refunded" })).ok).toBe(true);
    expect(repo.audit.some((a) => a.action === "payment_status_changed" && a.to_value === "refunded")).toBe(true);
  });
});

describe("booking actions", () => {
  it("rejects invalid transitions and unknown bookings", async () => {
    expect((await status("completed")).ok).toBe(false);
    const r = await applyAdminAction("00000000-0000-4000-8000-000000000000", { action: "add_note", note: "x" }, admin);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(404);
  });
  it("records internal notes in the audit history", async () => {
    await applyAdminAction(id, { action: "add_note", note: "Called customer" }, admin);
    const n = repo.audit.find((a) => a.action === "note_added")!;
    expect(n.meta.note).toBe("Called customer");
    expect(n.actor_label).toBe(admin.label);
  });
});
