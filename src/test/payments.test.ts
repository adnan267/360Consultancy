import { beforeEach, describe, expect, it } from "vitest";
import { POST as webhook } from "@/app/api/webhooks/payments/route";
import { createBookingRequest, applyAdminAction } from "@/lib/bookings";
import { setPaymentProviderForTests, verifyHmacSha256, type PaymentProvider } from "@/lib/payments/provider";
import { createHmac } from "node:crypto";
import type { MemoryRepo } from "@/lib/repo";
import { captureEmail, freshRepo, validBooking } from "./helpers";

const SECRET = "test-secret";
const sign = (b: string) => createHmac("sha256", SECRET).update(b).digest("hex");
const provider: PaymentProvider = {
  name: "mock",
  verifyAndParse(raw, headers) {
    if (!verifyHmacSha256(SECRET, raw, headers.get("x-signature"))) return null;
    return JSON.parse(raw);
  },
};
const post = (obj: unknown, sig?: string) => {
  const raw = JSON.stringify(obj);
  return webhook(new Request("https://360consultancy.pk/api/webhooks/payments", { method: "POST", headers: { "x-signature": sig ?? sign(raw) }, body: raw }));
};

let repo: MemoryRepo;
let reference: string;
let fee: number;
const admin = { id: "11111111-1111-4111-8111-111111111111", label: "admin@example.com", role: "admin" as const };

beforeEach(async () => {
  repo = freshRepo();
  captureEmail();
  process.env.SERVICES_ENABLED = "true";
  setPaymentProviderForTests(null);
  const r = await createBookingRequest(validBooking(), { ip: "1.1.1.1" });
  if (!r.ok) throw new Error("setup");
  reference = r.booking.reference;
  fee = r.booking.totalPayablePkr;
  await applyAdminAction(repo.bookings[0].id, { action: "set_status", status: "awaiting_payment" }, admin);
});

const evt = (over: Record<string, unknown> = {}) => ({ eventId: "evt_1", type: "payment.succeeded", bookingReference: reference, providerPaymentId: "pay_1", amountPkr: fee, currency: "PKR", ...over });

describe("payment webhook", () => {
  it("404s when no provider is configured", async () => {
    expect((await post(evt())).status).toBe(404);
  });
  it("rejects a bad signature and changes nothing", async () => {
    setPaymentProviderForTests(provider);
    expect((await post(evt(), "00".repeat(32))).status).toBe(401);
    expect(repo.payments[0].status).toBe("awaiting");
  });
  it("valid event → payment under review (never auto-verified)", async () => {
    setPaymentProviderForTests(provider);
    const res = await post(evt());
    expect(res.status).toBe(200);
    expect(repo.payments[0].status).toBe("under_review");
    expect(repo.payments[0].verified_by).toBeNull();
    expect(repo.bookings[0].status).toBe("payment_under_review");
  });
  it("is idempotent on event id", async () => {
    setPaymentProviderForTests(provider);
    await post(evt());
    const again = await (await post(evt())).json();
    expect(again.outcome).toBe("duplicate");
    expect(repo.audit.filter((a) => a.action === "payment_status_changed")).toHaveLength(1);
  });
  it("amount mismatch is recorded and rejected", async () => {
    setPaymentProviderForTests(provider);
    const body = await (await post(evt({ amountPkr: fee - 1 }))).json();
    expect(body.outcome).toBe("amount_mismatch");
    expect(repo.payments[0].status).toBe("awaiting");
  });
  it("wrong currency and unknown reference change nothing", async () => {
    setPaymentProviderForTests(provider);
    expect((await (await post(evt({ eventId: "e2", currency: "USD" }))).json()).outcome).toBe("currency_mismatch");
    expect((await (await post(evt({ eventId: "e3", bookingReference: "360-NOPE0000" }))).json()).outcome).toBe("unknown_booking");
    expect(repo.payments[0].status).toBe("awaiting");
  });
  it("failed-payment events never move state", async () => {
    setPaymentProviderForTests(provider);
    await post(evt({ eventId: "e4", type: "payment.failed" }));
    expect(repo.payments[0].status).toBe("awaiting");
  });
});

describe("verifyHmacSha256", () => {
  it("rejects empty, malformed and wrong signatures", () => {
    expect(verifyHmacSha256(SECRET, "x", null)).toBe(false);
    expect(verifyHmacSha256(SECRET, "x", "zz")).toBe(false);
    expect(verifyHmacSha256(SECRET, "x", sign("y"))).toBe(false);
    expect(verifyHmacSha256(SECRET, "x", sign("x"))).toBe(true);
  });
});

describe("report", () => {
  it("counts only verified payments in revenue", async () => {
    const r = await repo.getReport();
    expect(r.verifiedByMonth).toEqual([]);
    expect(r.byCountry[0].count).toBe(1);
  });
});
