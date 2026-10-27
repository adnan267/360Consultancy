import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as webhook } from "@/app/api/webhooks/nowpayments/route";
import { applyNowPaymentsIpn, createCase, registerClient, startOnlinePayment } from "@/lib/cases";
import { verifyIpn } from "@/lib/payments/nowpayments";
import { verifyEmail } from "@/lib/account";
import type { MemoryRepo } from "@/lib/repo";
import { MemoryStorage, setStorageForTests } from "@/lib/storage";
import { captureEmail, freshRepo, type CapturingEmail } from "./helpers";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn(), unstable_cache: <T extends (...a: never[]) => unknown>(fn: T) => fn }));

const SECRET = "ipn-secret-for-tests";
const sign = (body: object) => {
  const sort = (v: unknown): unknown => Array.isArray(v) ? v.map(sort) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, x]) => [k, sort(x)])) : v;
  return createHmac("sha512", SECRET).update(JSON.stringify(sort(body))).digest("hex");
};

let repo: MemoryRepo;
let mail: CapturingEmail;
let caseId: string;
let clientId: string;

beforeEach(async () => {
  repo = freshRepo();
  setStorageForTests(new MemoryStorage());
  mail = captureEmail();
  Object.assign(process.env, { SERVICES_ENABLED: "true", PORTAL_ENABLED: "true", NOWPAYMENTS_API_KEY: "key", NOWPAYMENTS_IPN_SECRET: SECRET, NOWPAYMENTS_PRICE_CURRENCY: "pkr" });
  const r = await registerClient({ fullName: "Sana Malik", email: "sana@example.com", password: "correct horse battery", consentPrivacy: true, consentTerms: true }, { ip: "1.1.1.1" });
  if (!r.ok) throw new Error(r.error);
  clientId = r.client.id;
  await verifyEmail({ token: /token=([\w-]+)/.exec(mail.sent[0].text)![1] }, "1.1.1.1");
  const c = await createCase(clientId, { countrySlug: "canada", purpose: "study" });
  if (!c.ok) throw new Error(c.error);
  caseId = c.caseId;
});
afterEach(() => {
  vi.unstubAllGlobals();
  for (const k of ["NOWPAYMENTS_API_KEY", "NOWPAYMENTS_IPN_SECRET", "NOWPAYMENTS_PRICE_CURRENCY"]) delete process.env[k];
});

const stubInvoice = () => vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ id: "inv-1", invoice_url: "https://nowpayments.io/payment/?iid=inv-1" }), { status: 200 })));
const ipn = (over: Record<string, unknown> = {}) => {
  const pay = repo.casePayments.find((p) => p.case_id === caseId)!;
  return { payment_id: 777, payment_status: "finished", invoice_id: "inv-1", order_id: `${caseId}:intake`, price_amount: pay.amount_pkr, price_currency: "pkr", ...over };
};

describe("NOWPayments", () => {
  it("accepts only correctly signed IPNs", () => {
    const body = { b: 1, a: { d: 2, c: 3 } };
    expect(verifyIpn(JSON.stringify(body), sign(body), SECRET)).toMatchObject({ b: 1 });
    expect(verifyIpn(JSON.stringify(body), sign({ ...body, b: 2 }), SECRET)).toBeNull();
    expect(verifyIpn(JSON.stringify(body), null, SECRET)).toBeNull();
    expect(verifyIpn("not json", "00", SECRET)).toBeNull();
  });

  it("webhook returns 404 when disabled and 401 on a bad signature", async () => {
    const mk = (sig: string) => new Request("https://360consultancy.pk/api/webhooks/nowpayments", { method: "POST", headers: { "x-nowpayments-sig": sig }, body: JSON.stringify(ipn()) });
    expect((await webhook(mk("00"))).status).toBe(401);
    delete process.env.NOWPAYMENTS_API_KEY;
    expect((await webhook(mk("00"))).status).toBe(404);
  });

  it("creates an invoice and stores what we asked for", async () => {
    stubInvoice();
    const r = await startOnlinePayment(clientId, caseId, "intake");
    expect(r).toMatchObject({ ok: true, url: expect.stringContaining("nowpayments.io") });
    expect(repo.casePayments[0]).toMatchObject({ provider: "nowpayments", provider_ref: "inv-1", provider_currency: "pkr" });
    expect(await startOnlinePayment(clientId, caseId, "review")).toMatchObject({ ok: false, status: 409 });
  });

  it("refuses an invoice URL that is not on nowpayments.io", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ id: "x", invoice_url: "https://evil.example/pay" }), { status: 200 })));
    expect(await startOnlinePayment(clientId, caseId, "intake")).toMatchObject({ ok: false });
  });

  it("verifies on 'finished', moves the case on, assigns an invoice number, and is idempotent", async () => {
    stubInvoice();
    await startOnlinePayment(clientId, caseId, "intake");
    expect(await applyNowPaymentsIpn(ipn({ payment_status: "confirming" }))).toBe("pending");
    expect(repo.casePayments[0].status).toBe("awaiting");
    expect(await applyNowPaymentsIpn(ipn())).toBe("verified");
    const p = repo.casePayments[0];
    expect(p).toMatchObject({ status: "verified", bank_reference: "nowpayments:777", verified_by: null });
    expect(p.invoice_no).toMatch(/^INV-/);
    expect((await repo.getCaseDetail(caseId))!.case.status).toBe("documents_open");
    expect(await applyNowPaymentsIpn(ipn())).toBe("ignored");
  });

  it("never verifies on a wrong amount, wrong invoice, or partial payment", async () => {
    stubInvoice();
    await startOnlinePayment(clientId, caseId, "intake");
    expect(await applyNowPaymentsIpn(ipn({ price_amount: 1 }))).toBe("rejected");
    expect(await applyNowPaymentsIpn(ipn({ invoice_id: "other" }))).toBe("rejected");
    expect(await applyNowPaymentsIpn(ipn({ payment_status: "partially_paid" }))).toBe("rejected");
    expect(await applyNowPaymentsIpn(ipn({ order_id: "nonsense" }))).toBe("unknown_order");
    expect(repo.casePayments[0].status).toBe("awaiting");
  });

  it("does not verify when no invoice was started by us", async () => {
    expect(await applyNowPaymentsIpn(ipn())).toBe("rejected");
    expect(repo.casePayments[0].status).toBe("awaiting");
  });
});
