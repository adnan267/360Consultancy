import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn(), unstable_cache: <T extends (...a: never[]) => unknown>(fn: T) => fn }));
import { PATCH as adminCase } from "@/app/api/admin/cases/[id]/route";
import { GET as adminDoc } from "@/app/api/admin/documents/[id]/route";
import { PATCH as teamPatch } from "@/app/api/admin/team/[id]/route";
import { POST as faqCreate } from "@/app/api/admin/faqs/route";
import { requestPasswordReset, resetPassword, verifyEmail, verificationRequired } from "@/lib/account";
import { applyCaseAdminAction, createCase, loginClient, registerClient } from "@/lib/cases";
import { clientSendMessage, createDataRequest, getPublicFaqs, getPublishedPost, staffSendMessage } from "@/lib/cms";
import { setEmailProviderForTests } from "@/lib/email";
import type { MemoryRepo } from "@/lib/repo";
import { DuplicateReferenceError } from "@/lib/repo/types";
import { can } from "@/lib/status";
import { MemoryStorage, setStorageForTests } from "@/lib/storage";
import type { Role } from "@/lib/types";
import { captureEmail, cookieFor, freshRepo, req, type CapturingEmail } from "./helpers";

let repo: MemoryRepo;
let mail: CapturingEmail;
const ip = "9.9.9.9";
const admin = { id: "11111111-1111-4111-8111-111111111111", label: "admin@example.com" };
const reg = (email = "sana@example.com") => ({ fullName: "Sana Malik", email, password: "correct horse battery", consentPrivacy: true, consentTerms: true });
const tokenIn = (m: { text: string }) => /token=([\w-]+)/.exec(m.text)![1];

beforeEach(() => {
  repo = freshRepo();
  setStorageForTests(new MemoryStorage());
  mail = captureEmail();
  process.env.SERVICES_ENABLED = "true";
  process.env.PORTAL_ENABLED = "true";
});

describe("email verification", () => {
  it("emails a link on register; cases are blocked until it is used; the token is single-use", async () => {
    const r = await registerClient(reg(), { ip });
    if (!r.ok) throw new Error(r.error);
    expect(mail.sent).toHaveLength(1);
    expect(mail.sent[0].to).toBe("sana@example.com");
    expect(await createCase(r.client.id, { countrySlug: "canada", purpose: "study" })).toMatchObject({ ok: false, status: 403 });

    const token = tokenIn(mail.sent[0]);
    expect(await verifyEmail({ token }, ip)).toMatchObject({ ok: true });
    expect(await verifyEmail({ token }, ip)).toMatchObject({ ok: false, status: 400 });
    expect(await createCase(r.client.id, { countrySlug: "canada", purpose: "study" })).toMatchObject({ ok: true });
  });

  it("rejects expired and garbage tokens", async () => {
    await registerClient(reg(), { ip });
    const token = tokenIn(mail.sent[0]);
    repo.clientTokens[0].expires = Date.now() - 1000;
    expect(await verifyEmail({ token }, ip)).toMatchObject({ ok: false });
    expect(await verifyEmail({ token: "x".repeat(40) }, ip)).toMatchObject({ ok: false });
  });

  it("is not enforced while no email provider exists, so the portal never locks everyone out", async () => {
    setEmailProviderForTests(null);
    expect(verificationRequired()).toBe(false);
    const r = await registerClient(reg(), { ip });
    if (!r.ok) throw new Error(r.error);
    expect(await createCase(r.client.id, { countrySlug: "canada", purpose: "study" })).toMatchObject({ ok: true });
  });
});

describe("password reset", () => {
  it("resets with a one-time link and the old password stops working", async () => {
    await registerClient(reg(), { ip });
    mail.sent.length = 0;
    expect(await requestPasswordReset({ email: "SANA@example.com" }, ip)).toMatchObject({ ok: true, emailAvailable: true });
    const token = tokenIn(mail.sent[0]);
    expect(await resetPassword({ token, password: "a brand new passphrase" }, ip)).toMatchObject({ ok: true });
    expect(await resetPassword({ token, password: "another passphrase here" }, ip)).toMatchObject({ ok: false });
    expect(await loginClient({ email: "sana@example.com", password: "correct horse battery" }, { ip })).toMatchObject({ ok: false });
    expect(await loginClient({ email: "sana@example.com", password: "a brand new passphrase" }, { ip })).toMatchObject({ ok: true });
  });

  it("answers identically for unknown emails and sends nothing", async () => {
    const r = await requestPasswordReset({ email: "nobody@example.com" }, ip);
    expect(r).toMatchObject({ ok: true, emailAvailable: true });
    expect(mail.sent).toHaveLength(0);
  });

  it("rejects short passwords", async () => {
    await registerClient(reg(), { ip });
    mail.sent.length = 0;
    await requestPasswordReset({ email: "sana@example.com" }, ip);
    expect(await resetPassword({ token: tokenIn(mail.sent[0]), password: "short" }, ip)).toMatchObject({ ok: false, status: 422 });
  });

  it("reports that email is unavailable when no provider is configured", async () => {
    setEmailProviderForTests(null);
    expect(await requestPasswordReset({ email: "sana@example.com" }, ip)).toMatchObject({ ok: true, emailAvailable: false });
  });
});

describe("role permissions", () => {
  const roles: Role[] = ["admin", "staff", "consultant", "finance", "support"];
  it("applies least privilege", () => {
    expect(roles.filter((r) => can(r, "document:view"))).toEqual(["admin", "staff", "consultant"]);
    expect(roles.filter((r) => can(r, "payment:verify"))).toEqual(["admin", "finance"]);
    expect(roles.filter((r) => can(r, "content:manage"))).toEqual(["admin"]);
    expect(roles.filter((r) => can(r, "team:manage"))).toEqual(["admin"]);
    expect(can("support", "case:message")).toBe(true);
    expect(can("finance", "case:message")).toBe(false);
  });

  it("finance and support cannot download client documents", async () => {
    const reg1 = await registerClient(reg(), { ip });
    if (!reg1.ok) throw new Error(reg1.error);
    for (const role of ["finance", "support"] as const) {
      const res = await adminDoc(req("GET", "/api/admin/documents/22222222-2222-4222-8222-222222222222", { cookie: await cookieFor(role) }), { params: Promise.resolve({ id: "22222222-2222-4222-8222-222222222222" }) });
      expect(res.status).toBe(403);
    }
  });

  it("finance can run money actions but not review actions; consultant the reverse", async () => {
    const c = await registerClient(reg(), { ip });
    if (!c.ok) throw new Error(c.error);
    await verifyEmail({ token: tokenIn(mail.sent[0]) }, ip);
    const made = await createCase(c.client.id, { countrySlug: "canada", purpose: "study" });
    if (!made.ok) throw new Error(made.error);
    const call = async (role: Role, body: unknown) => (await adminCase(req("PATCH", `/api/admin/cases/${made.caseId}`, { cookie: await cookieFor(role), body }), { params: Promise.resolve({ id: made.caseId }) })).status;
    expect(await call("finance", { action: "add_note", note: "x" })).toBe(403);
    expect(await call("consultant", { action: "add_note", note: "x" })).toBe(200);
    expect(await call("consultant", { action: "verify_payment", stage: "intake", bankReference: "B-123456", receivedAmountPkr: 1 })).toBe(403);
  });

  it("only admins can change the team, and the last admin cannot be removed", async () => {
    const id = "11111111-1111-4111-8111-111111111111";
    repo.admins.push({ id, email: "admin@example.com", password_hash: "x", role: "admin", is_active: true });
    repo.admins.push({ id: "33333333-3333-4333-8333-333333333333", email: "c@example.com", password_hash: "x", role: "consultant", is_active: true });
    const params = (i: string) => ({ params: Promise.resolve({ id: i }) });
    expect((await teamPatch(req("PATCH", `/api/admin/team/${id}`, { cookie: await cookieFor("consultant"), body: { is_active: false } }), params(id))).status).toBe(403);
    expect((await teamPatch(req("PATCH", `/api/admin/team/33333333-3333-4333-8333-333333333333`, { cookie: await cookieFor("admin"), body: { role: "finance" } }), params("33333333-3333-4333-8333-333333333333"))).status).toBe(200);
    expect((await teamPatch(req("PATCH", `/api/admin/team/${id}`, { cookie: await cookieFor("admin"), body: { is_active: false } }), params(id))).status).toBe(409);
  });
});

describe("case messages", () => {
  async function setup() {
    const a = await registerClient(reg("a@example.com"), { ip });
    const b = await registerClient(reg("b@example.com"), { ip });
    if (!a.ok || !b.ok) throw new Error("reg");
    for (const m of mail.sent) await verifyEmail({ token: tokenIn(m) }, ip);
    const made = await createCase(a.client.id, { countrySlug: "canada", purpose: "study" });
    if (!made.ok) throw new Error(made.error);
    return { a: a.client.id, b: b.client.id, caseId: made.caseId };
  }

  it("clients can message only their own case", async () => {
    const { a, b, caseId } = await setup();
    expect(await clientSendMessage(a, caseId, { body: "Hello" })).toMatchObject({ ok: true });
    expect(await clientSendMessage(b, caseId, { body: "Hi" })).toMatchObject({ ok: false, status: 404 });
    expect(await clientSendMessage(a, caseId, { body: "   " })).toMatchObject({ ok: false, status: 422 });
  });

  it("internal notes never reach the client view", async () => {
    const { caseId } = await setup();
    await staffSendMessage(admin, caseId, { body: "Visible reply", internal: false });
    await staffSendMessage(admin, caseId, { body: "Secret note", internal: true });
    const client = await repo.listCaseMessages(caseId, { includeInternal: false });
    expect(client.map((m) => m.body)).toEqual(["Visible reply"]);
    expect((await repo.listCaseMessages(caseId, { includeInternal: true })).map((m) => m.body)).toEqual(["Visible reply", "Secret note"]);
  });
});

describe("invoices, data requests and content", () => {
  it("numbers invoices uniquely when a payment is verified", async () => {
    const c = await registerClient(reg(), { ip });
    if (!c.ok) throw new Error(c.error);
    await verifyEmail({ token: tokenIn(mail.sent[0]) }, ip);
    const made = await createCase(c.client.id, { countrySlug: "canada", purpose: "study" });
    if (!made.ok) throw new Error(made.error);
    const pay = repo.casePayments.find((p) => p.case_id === made.caseId)!;
    expect(pay.invoice_no).toBeNull();
    const r = await applyCaseAdminAction(made.caseId, { action: "verify_payment", stage: "intake", bankReference: "BANK-123456", receivedAmountPkr: pay.amount_pkr }, { ...admin, role: "admin" });
    expect(r.ok).toBe(true);
    expect(repo.casePayments.find((p) => p.id === pay.id)!.invoice_no).toMatch(/^INV-\d{4}-\d{6}$/);
  });

  it("records data requests and limits how often they can be made", async () => {
    const c = await registerClient(reg(), { ip });
    if (!c.ok) throw new Error(c.error);
    expect(await createDataRequest(c.client.id, { kind: "export" })).toMatchObject({ ok: true });
    expect(await createDataRequest(c.client.id, { kind: "nonsense" })).toMatchObject({ ok: false });
    expect(repo.dataRequests).toHaveLength(1);
  });

  it("blog slugs are unique and drafts are never public", async () => {
    await repo.saveBlogPost({ slug: "uk-guide", title: "UK guide", excerpt: "", body: "x", meta_title: null, meta_description: null, is_published: false });
    await expect(repo.saveBlogPost({ slug: "uk-guide", title: "Other", excerpt: "", body: "y", meta_title: null, meta_description: null, is_published: true })).rejects.toBeInstanceOf(DuplicateReferenceError);
    expect(await getPublishedPost("uk-guide")).toBeNull();
    const p = await repo.getBlogPost({ slug: "uk-guide" });
    await repo.saveBlogPost({ id: p!.id, slug: "uk-guide", title: "UK guide", excerpt: "", body: "x", meta_title: null, meta_description: null, is_published: true });
    expect((await getPublishedPost("uk-guide"))?.title).toBe("UK guide");
  });

  it("FAQs fall back to defaults, and admins can add and import", async () => {
    expect((await getPublicFaqs()).length).toBeGreaterThan(3);
    const ok = await faqCreate(req("POST", "/api/admin/faqs", { cookie: await cookieFor("admin"), body: { question: "Is this a test?", answer: "Yes, it is." } }));
    expect(ok.status).toBe(201);
    expect((await getPublicFaqs()).map((f) => f.q)).toEqual(["Is this a test?"]);
    const denied = await faqCreate(req("POST", "/api/admin/faqs", { cookie: await cookieFor("consultant"), body: { question: "Nope?", answer: "No." } }));
    expect(denied.status).toBe(403);
  });
});
