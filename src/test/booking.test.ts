import { beforeEach, describe, expect, it } from "vitest";
import { createBookingRequest } from "@/lib/bookings";
import { calculatePayable } from "@/lib/pricing";
import { canTransitionBooking, canTransitionPayment, can } from "@/lib/status";
import { setEmailProviderForTests } from "@/lib/email";
import { captureEmail, freshRepo, validBooking } from "./helpers";
import type { MemoryRepo } from "@/lib/repo";

let repo: MemoryRepo;
beforeEach(() => {
  repo = freshRepo();
  setEmailProviderForTests(null);
  process.env.SERVICES_ENABLED = "true";
});
const ip = { ip: "1.2.3.4" };

describe("feature flag", () => {
  it("defaults to disabled and creates nothing", async () => {
    delete process.env.SERVICES_ENABLED;
    const r = await createBookingRequest(validBooking(), ip);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(503);
    expect(repo.bookings).toHaveLength(0);
  });
  it("only the exact string 'true' enables it", async () => {
    for (const v of ["1", "TRUE", "yes", "false", ""]) {
      process.env.SERVICES_ENABLED = v;
      expect((await createBookingRequest(validBooking(), ip)).ok).toBe(false);
    }
    expect(repo.bookings).toHaveLength(0);
  });
});

describe("server-side pricing", () => {
  it("stores the fee from the database, not the browser", async () => {
    const r = await createBookingRequest(validBooking(), ip);
    expect(r.ok).toBe(true);
    expect(repo.bookings[0]!.fee_pkr).toBe(1500);
    expect(repo.payments[0]!.amount_pkr).toBe(1500);
  });
  it("rejects a request that tries to supply its own fee", async () => {
    const r = await createBookingRequest(validBooking({ fee: 1, totalPayablePkr: 1 }), ip);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(422);
    expect(repo.bookings).toHaveLength(0);
  });
  it("follows a database price change", async () => {
    repo.services.find((s) => s.slug === "visa-guidance-session")!.fee_pkr = 2000;
    await createBookingRequest(validBooking(), ip);
    expect(repo.bookings[0]!.fee_pkr).toBe(2000);
  });
  it("calculatePayable keeps government fees out of the total", () => {
    const p = calculatePayable({ fee_pkr: 3500, fee_is_starting_price: false });
    expect(p).toMatchObject({ governmentFeesPkr: 0, totalPayablePkr: 3500, currency: "PKR" });
    expect(() => calculatePayable({ fee_pkr: -1, fee_is_starting_price: false })).toThrow();
  });
});

describe("booking creation rules", () => {
  it("starts as request_received with awaiting payment and an audit entry", async () => {
    const mail = captureEmail();
    const r = await createBookingRequest(validBooking(), ip);
    expect(r.ok && r.booking.status).toBe("request_received");
    expect(repo.bookings[0]!.status).toBe("request_received");
    expect(repo.payments[0]!.status).toBe("awaiting");
    expect(repo.audit.map((a) => a.action)).toContain("booking_created");
    expect(mail.sent[0]!.subject).toMatch(/received your request/);
    expect(mail.sent[0]!.text).toMatch(/not a confirmed appointment/);
  });
  it("rejects inactive (regulated) services", async () => {
    const r = await createBookingRequest(validBooking({ serviceSlug: "application-assistance" }), ip);
    expect(r.ok).toBe(false);
    expect(repo.bookings).toHaveLength(0);
  });
  it("rejects unknown service/country", async () => {
    expect((await createBookingRequest(validBooking({ serviceSlug: "nope" }), ip)).ok).toBe(false);
    expect((await createBookingRequest(validBooking({ countrySlug: "nope" }), ip)).ok).toBe(false);
  });
  it("silently drops honeypot submissions", async () => {
    const r = await createBookingRequest(validBooking({ website: "http://spam" }), ip);
    expect(r.ok).toBe(true);
    expect(repo.bookings).toHaveLength(0);
  });
  it("rate limits repeated requests from one IP", async () => {
    let last = 0;
    for (let i = 0; i < 6; i++) {
      const r = await createBookingRequest(validBooking({ email: `u${i}@example.com` }), ip);
      if (!r.ok) last = r.status;
    }
    expect(last).toBe(429);
  });
  it("does not report email as sent when no provider is configured", async () => {
    await createBookingRequest(validBooking(), ip);
    const n = repo.audit.find((a) => a.action === "notification")!;
    expect(n.meta.sent).toBe(false);
  });
});

describe("status machines and roles", () => {
  it("booking transitions", () => {
    expect(canTransitionBooking("request_received", "confirmed")).toBe(false);
    expect(canTransitionBooking("request_received", "awaiting_payment")).toBe(true);
    expect(canTransitionBooking("completed", "in_progress")).toBe(false);
    expect(canTransitionBooking("cancelled", "confirmed")).toBe(false);
  });
  it("payment transitions", () => {
    expect(canTransitionPayment("awaiting", "verified")).toBe(false);
    expect(canTransitionPayment("under_review", "verified")).toBe(true);
    expect(canTransitionPayment("verified", "refunded")).toBe(true);
  });
  it("only admins verify payments, manage services and export", () => {
    expect(can("staff", "payment:verify")).toBe(false);
    expect(can("staff", "service:manage")).toBe(false);
    expect(can("staff", "export:csv")).toBe(false);
    expect(can("admin", "payment:verify")).toBe(true);
  });
});
