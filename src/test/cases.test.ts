import { beforeEach, describe, expect, it } from "vitest";
import { PATCH as adminCase } from "@/app/api/admin/cases/[id]/route";
import { GET as adminDoc } from "@/app/api/admin/documents/[id]/route";
import { GET as portalDoc } from "@/app/api/portal/documents/[id]/route";
import { POST as portalCaseAction } from "@/app/api/portal/cases/[id]/route";
import { POST as portalLogin } from "@/app/api/portal/login/route";
import { POST as portalRegister } from "@/app/api/portal/register/route";
import { applyCaseAdminAction, clientCaseAction, createCase, deleteClientDocument, loginClient, readDocument, registerClient, sniffMime, uploadDocument } from "@/lib/cases";
import { signClientSession } from "@/lib/client-auth";
import type { MemoryRepo } from "@/lib/repo";
import { MemoryStorage, setStorageForTests } from "@/lib/storage";
import type { Actor } from "@/lib/types";
import { cookieFor, freshRepo, req } from "./helpers";

let repo: MemoryRepo;
let storage: MemoryStorage;
const admin: Actor = { id: "11111111-1111-4111-8111-111111111111", label: "admin@example.com", role: "admin" };
const PDF = new TextEncoder().encode("%PDF-1.4 test file");
const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
const ip = "1.2.3.4";

const reg = (over: Record<string, unknown> = {}) => ({ fullName: "Ayesha Khan", email: "Ayesha@Example.com", password: "correct horse battery", consentPrivacy: true, consentTerms: true, ...over });

async function signedUpClient() {
  const r = await registerClient(reg(), { ip });
  if (!r.ok) throw new Error("register failed: " + r.error);
  return r.client.id;
}
async function newCase(clientId: string) {
  const r = await createCase(clientId, { countrySlug: "canada", purpose: "study" });
  if (!r.ok) throw new Error("case failed: " + r.error);
  return r.caseId;
}
const verify = (caseId: string, stage: "intake" | "review" | "submission", amount: number) =>
  applyCaseAdminAction(caseId, { action: "verify_payment", stage, bankReference: "BANK-123456", receivedAmountPkr: amount }, admin);
const dueOf = (caseId: string, stage: string) => repo.casePayments.find((p) => p.case_id === caseId && p.stage === stage)!;

beforeEach(() => {
  repo = freshRepo();
  storage = new MemoryStorage();
  setStorageForTests(storage);
  process.env.SERVICES_ENABLED = "true";
  process.env.PORTAL_ENABLED = "true";
});

describe("feature flags", () => {
  it("portal is closed by default and when services are off", async () => {
    delete process.env.PORTAL_ENABLED;
    expect(await registerClient(reg(), { ip })).toMatchObject({ ok: false, status: 503 });
    process.env.PORTAL_ENABLED = "true";
    process.env.SERVICES_ENABLED = "false";
    expect(await registerClient(reg(), { ip })).toMatchObject({ ok: false, status: 503 });
  });
});

describe("accounts", () => {
  it("registers, hashes the password, rejects duplicates and weak passwords", async () => {
    await signedUpClient();
    expect(repo.clients[0].password_hash).not.toContain("correct horse");
    expect(await registerClient(reg({ email: "ayesha@example.com" }), { ip })).toMatchObject({ ok: false, status: 409 });
    expect(await registerClient(reg({ email: "b@example.com", password: "short" }), { ip })).toMatchObject({ ok: false, status: 422 });
    expect(await registerClient(reg({ email: "c@example.com", consentTerms: false }), { ip })).toMatchObject({ ok: false, status: 422 });
  });
  it("login works, is generic on failure and rate-limited", async () => {
    await signedUpClient();
    expect(await loginClient({ email: "ayesha@example.com", password: "correct horse battery" }, { ip })).toMatchObject({ ok: true });
    expect(await loginClient({ email: "ayesha@example.com", password: "wrong" }, { ip })).toMatchObject({ ok: false, status: 401 });
    expect(await loginClient({ email: "nobody@example.com", password: "wrong" }, { ip })).toMatchObject({ ok: false, status: 401 });
    let last;
    for (let i = 0; i < 10; i++) last = await loginClient({ email: "ayesha@example.com", password: "wrong" }, { ip: "9.9.9.9" });
    expect(last).toMatchObject({ ok: false, status: 429 });
  });
  it("API sets an HttpOnly session cookie and rejects cross-origin posts", async () => {
    const ok = await portalRegister(req("POST", "/api/portal/register", { body: reg() }));
    expect(ok.status).toBe(201);
    expect(ok.headers.get("set-cookie")).toMatch(/client_session=.*HttpOnly/);
    expect((await portalLogin(req("POST", "/api/portal/login", { body: { email: "a@b.co", password: "x" }, origin: "https://evil.example" }))).status).toBe(403);
  });
});

describe("the three-stage flow", () => {
  it("runs end to end, and every stage needs a verified payment", async () => {
    const cid = await signedUpClient();
    const caseId = await newCase(cid);
    const intake = dueOf(caseId, "intake");
    expect(intake.amount_pkr).toBe(repo.services.find((s) => s.slug === "visa-guidance-session")!.fee_pkr);

    // Step 1: cannot upload before the starting fee is verified
    expect(await uploadDocument(cid, caseId, { docType: "passport" }, { name: "p.pdf", bytes: PDF })).toMatchObject({ ok: false, status: 409 });
    expect(await clientCaseAction(cid, caseId, { action: "request_review" })).toMatchObject({ ok: false, status: 409 });

    // client says "paid" → under review, but that alone unlocks nothing
    expect(await clientCaseAction(cid, caseId, { action: "mark_paid", stage: "intake", clientReference: "my transfer" })).toMatchObject({ ok: true });
    expect(repo.cases[0].status).toBe("awaiting_intake_payment");

    // admin: wrong amount refused, right amount unlocks
    expect(await verify(caseId, "intake", intake.amount_pkr - 1)).toMatchObject({ ok: false, status: 422 });
    expect(await verify(caseId, "intake", intake.amount_pkr)).toMatchObject({ ok: true });
    expect(repo.cases[0].status).toBe("documents_open");
    expect(dueOf(caseId, "intake").verified_by).toBe(admin.id);

    // Step 2: uploads (bytes decide the type; wrong content rejected)
    expect(await uploadDocument(cid, caseId, { docType: "passport" }, { name: "notes.pdf", bytes: new TextEncoder().encode("not a pdf") })).toMatchObject({ ok: false, status: 415 });
    expect(await uploadDocument(cid, caseId, { docType: "passport" }, { name: "x.pdf", bytes: new Uint8Array(4 * 1024 * 1024 + 1).fill(0x25) })).toMatchObject({ ok: false, status: 413 });
    expect(await clientCaseAction(cid, caseId, { action: "request_review" })).toMatchObject({ ok: false, status: 422 }); // no documents yet
    const up = await uploadDocument(cid, caseId, { docType: "passport" }, { name: "../../etc/passwd.pdf", bytes: PDF });
    expect(up).toMatchObject({ ok: true });
    const doc = repo.documents[0];
    expect(doc.original_name).toBe("passwd.pdf");
    expect(doc.storage_path.startsWith(caseId + "/")).toBe(true);
    expect(storage.files.size).toBe(1);

    // Step 3: review fee
    expect(await clientCaseAction(cid, caseId, { action: "request_review" })).toMatchObject({ ok: true });
    expect(repo.cases[0].status).toBe("awaiting_review_payment");
    const reviewFee = dueOf(caseId, "review").amount_pkr;
    expect(reviewFee).toBe(repo.services.find((s) => s.slug === "document-review")!.fee_pkr);
    expect(await uploadDocument(cid, caseId, { docType: "other" }, { name: "b.pdf", bytes: PDF })).toMatchObject({ ok: false, status: 409 }); // locked
    expect(await verify(caseId, "review", reviewFee)).toMatchObject({ ok: true });
    expect(repo.cases[0].status).toBe("in_review");

    // Step 4: staff review — cannot finish until documents are accepted
    expect(await applyCaseAdminAction(caseId, { action: "complete_review", report: "All documents look complete for this route.", quotePkr: 9000 }, admin)).toMatchObject({ ok: false, status: 422 });
    expect(await applyCaseAdminAction(caseId, { action: "set_document_status", documentId: doc.id, status: "accepted" }, admin)).toMatchObject({ ok: true });
    expect(await applyCaseAdminAction(caseId, { action: "complete_review", report: "All documents look complete for this route.", quotePkr: 9000 }, admin)).toMatchObject({ ok: true });
    expect(repo.cases[0].status).toBe("review_complete");

    // Step 5/6: client accepts the quote, pays the submission fee (amount = staff quote)
    expect(await clientCaseAction(cid, caseId, { action: "accept_quote" })).toMatchObject({ ok: true });
    expect(dueOf(caseId, "submission").amount_pkr).toBe(9000);
    expect(await applyCaseAdminAction(caseId, { action: "record_submission", reference: "REF-1" }, admin)).toMatchObject({ ok: false, status: 409 }); // not paid yet
    expect(await verify(caseId, "submission", 9000)).toMatchObject({ ok: true });
    expect(repo.cases[0].status).toBe("submission_in_progress");

    // Step 7: staff records the submission
    expect(await applyCaseAdminAction(caseId, { action: "record_submission", reference: "REF-1", notes: "Submitted online" }, admin)).toMatchObject({ ok: true });
    expect(repo.cases[0]).toMatchObject({ status: "submitted", submission_reference: "REF-1" });
    expect(repo.audit.filter((a) => a.case_id === caseId).length).toBeGreaterThan(8);
  });

  it("fixes loop: sent back for fixes, resubmitted without a second review fee", async () => {
    const cid = await signedUpClient();
    const caseId = await newCase(cid);
    await verify(caseId, "intake", dueOf(caseId, "intake").amount_pkr);
    await uploadDocument(cid, caseId, { docType: "passport" }, { name: "p.pdf", bytes: PDF });
    await clientCaseAction(cid, caseId, { action: "request_review" });
    await verify(caseId, "review", dueOf(caseId, "review").amount_pkr);
    const doc = repo.documents[0];
    expect(await applyCaseAdminAction(caseId, { action: "set_document_status", documentId: doc.id, status: "needs_fix" }, admin)).toMatchObject({ ok: false, status: 422 }); // note required
    await applyCaseAdminAction(caseId, { action: "set_document_status", documentId: doc.id, status: "needs_fix", note: "Scan is blurry" }, admin);
    await applyCaseAdminAction(caseId, { action: "request_fixes", note: "Please rescan" }, admin);
    expect(repo.cases[0].status).toBe("documents_open");
    expect(await clientCaseAction(cid, caseId, { action: "request_review" })).toMatchObject({ ok: false, status: 422 }); // fix first
    expect(await deleteClientDocument(cid, doc.id)).toMatchObject({ ok: true });
    expect(storage.files.size).toBe(0);
    await uploadDocument(cid, caseId, { docType: "passport" }, { name: "p2.jpg", bytes: JPG });
    expect(await clientCaseAction(cid, caseId, { action: "request_review" })).toMatchObject({ ok: true });
    expect(repo.cases[0].status).toBe("in_review"); // review fee already paid
    expect(repo.casePayments.filter((p) => p.stage === "review")).toHaveLength(1);
  });

  it("rejection returns the payment to the client; wrong-stage payments are refused", async () => {
    const cid = await signedUpClient();
    const caseId = await newCase(cid);
    expect(await clientCaseAction(cid, caseId, { action: "mark_paid", stage: "review" })).toMatchObject({ ok: false, status: 409 });
    await clientCaseAction(cid, caseId, { action: "mark_paid", stage: "intake" });
    expect(await clientCaseAction(cid, caseId, { action: "mark_paid", stage: "intake" })).toMatchObject({ ok: false, status: 409 }); // already checking
    expect(await applyCaseAdminAction(caseId, { action: "reject_payment", stage: "intake", note: "Not found in bank" }, admin)).toMatchObject({ ok: true });
    expect(dueOf(caseId, "intake").status).toBe("rejected");
    expect(await clientCaseAction(cid, caseId, { action: "mark_paid", stage: "intake" })).toMatchObject({ ok: true });
  });

  it("cancel + refund rules", async () => {
    const cid = await signedUpClient();
    const caseId = await newCase(cid);
    expect(await applyCaseAdminAction(caseId, { action: "refund_payment", stage: "intake" }, admin)).toMatchObject({ ok: false, status: 409 });
    await verify(caseId, "intake", dueOf(caseId, "intake").amount_pkr);
    expect(await clientCaseAction(cid, caseId, { action: "cancel" })).toMatchObject({ ok: false, status: 409 }); // paid: must contact us
    expect(await applyCaseAdminAction(caseId, { action: "cancel", note: "Client asked" }, admin)).toMatchObject({ ok: true });
    expect(await applyCaseAdminAction(caseId, { action: "refund_payment", stage: "intake" }, admin)).toMatchObject({ ok: true });
    expect(dueOf(caseId, "intake").status).toBe("refunded");
  });
});

describe("isolation and authorisation", () => {
  it("a client can never see or download another client's case or documents", async () => {
    const a = await signedUpClient();
    const b = (await registerClient(reg({ email: "other@example.com" }), { ip })) as { ok: true; client: { id: string } };
    const caseId = await newCase(a);
    await verify(caseId, "intake", dueOf(caseId, "intake").amount_pkr);
    await uploadDocument(a, caseId, { docType: "passport" }, { name: "p.pdf", bytes: PDF });
    const doc = repo.documents[0];
    expect(await readDocument(doc.id, a)).not.toBeNull();
    expect(await readDocument(doc.id, b.client.id)).toBeNull();
    expect(await clientCaseAction(b.client.id, caseId, { action: "cancel" })).toMatchObject({ ok: false, status: 404 });
    expect(await uploadDocument(b.client.id, caseId, { docType: "other" }, { name: "x.pdf", bytes: PDF })).toMatchObject({ ok: false, status: 404 });
    expect(await deleteClientDocument(b.client.id, doc.id)).toMatchObject({ ok: false, status: 404 });
    const cookieB = `client_session=${encodeURIComponent(await signClientSession({ sub: b.client.id, email: "other@example.com" }))}`;
    const res = await portalDoc(req("GET", `/api/portal/documents/${doc.id}`, { cookie: cookieB }), { params: Promise.resolve({ id: doc.id }) });
    expect(res.status).toBe(404);
  });

  it("downloads are attachments with nosniff, and the owner gets the exact bytes", async () => {
    const a = await signedUpClient();
    const caseId = await newCase(a);
    await verify(caseId, "intake", dueOf(caseId, "intake").amount_pkr);
    await uploadDocument(a, caseId, { docType: "passport" }, { name: "p.pdf", bytes: PDF });
    const doc = repo.documents[0];
    const cookie = `client_session=${encodeURIComponent(await signClientSession({ sub: a, email: "ayesha@example.com" }))}`;
    const res = await portalDoc(req("GET", `/api/portal/documents/${doc.id}`, { cookie }), { params: Promise.resolve({ id: doc.id }) });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-disposition")).toMatch(/^attachment/);
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(PDF);
  });

  it("admin routes: anonymous → 401, staff cannot touch money, client token is not an admin token", async () => {
    const cid = await signedUpClient();
    const caseId = await newCase(cid);
    const ctx = { params: Promise.resolve({ id: caseId }) };
    const body = { action: "verify_payment", stage: "intake", bankReference: "BANK-1", receivedAmountPkr: dueOf(caseId, "intake").amount_pkr };
    expect((await adminCase(req("PATCH", `/api/admin/cases/${caseId}`, { body }), ctx)).status).toBe(401);
    expect((await adminCase(req("PATCH", `/api/admin/cases/${caseId}`, { body, cookie: await cookieFor("staff") }), ctx)).status).toBe(403);
    const clientTok = `admin_session=${encodeURIComponent(await signClientSession({ sub: cid, email: "ayesha@example.com" }))}`;
    expect((await adminCase(req("PATCH", `/api/admin/cases/${caseId}`, { body, cookie: clientTok }), ctx)).status).toBe(401);
    expect(repo.cases[0].status).toBe("awaiting_intake_payment");
    expect((await adminCase(req("PATCH", `/api/admin/cases/${caseId}`, { body, cookie: await cookieFor("admin") }), ctx)).status).toBe(200);
    expect(repo.cases[0].status).toBe("documents_open");
    // staff may still do non-money actions
    expect((await adminCase(req("PATCH", `/api/admin/cases/${caseId}`, { body: { action: "add_note", note: "called client" }, cookie: await cookieFor("staff") }), ctx)).status).toBe(200);
    const docRes = await adminDoc(req("GET", "/api/admin/documents/00000000-0000-4000-8000-000000000000"), { params: Promise.resolve({ id: "00000000-0000-4000-8000-000000000000" }) });
    expect(docRes.status).toBe(401);
  });

  it("client session cookie cannot be used on portal routes after being signed as admin-style token", async () => {
    const cid = await signedUpClient();
    const caseId = await newCase(cid);
    const adminTok = `client_session=${encodeURIComponent((await cookieFor("admin")).split("=")[1])}`;
    const r = await portalCaseAction(req("POST", `/api/portal/cases/${caseId}`, { body: { action: "cancel" }, cookie: adminTok }), { params: Promise.resolve({ id: caseId }) });
    expect(r.status).toBe(401);
  });
});

describe("file sniffing", () => {
  it("accepts only real PDF/JPEG/PNG bytes", () => {
    expect(sniffMime(PDF)?.mime).toBe("application/pdf");
    expect(sniffMime(JPG)?.mime).toBe("image/jpeg");
    expect(sniffMime(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))?.mime).toBe("image/png");
    expect(sniffMime(new TextEncoder().encode("<html><script>"))).toBeNull();
    expect(sniffMime(new TextEncoder().encode("MZ\x90\x00"))).toBeNull();
  });
});
