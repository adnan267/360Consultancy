import { randomUUID } from "node:crypto";
import { sendVerificationEmail, verificationRequired } from "./account";
import { hashPassword, verifyPassword } from "./auth";
import type { Result } from "./bookings";
import { CASE_TRANSITIONS, FINAL_STATUSES, NEXT_AFTER_PAYMENT, PAYING_STAGE, UPLOADS_OPEN, canTransitionCase } from "./case-status";
import { notifyAdmins, sendPlainEmail } from "./email";
import { portalEnabled, siteUrl } from "./env";
import { generateCaseReference } from "./reference";
import { getRepo, isDatabaseConfigured } from "./repo";
import { DuplicateEmailError, DuplicateReferenceError } from "./repo/types";
import { canTransitionPayment } from "./status";
import { getStorage, isStorageConfigured } from "./storage";
import { CASE_STATUS_LABEL, type Actor, type Case, type CaseDetail, type CaseDocument, type CasePayment, type CaseStage, type Client } from "./types";
import { adminCaseActionSchema, clientCaseActionSchema, clientLoginSchema, clientRegisterSchema, createCaseSchema, uploadMetaSchema, type AdminCaseAction } from "./validation";

const fail = (status: number, error: string, fields?: Record<string, string[]>) => ({ ok: false as const, status, error, fields });
const zodFields = (issues: { path: PropertyKey[]; message: string }[]) => {
  const f: Record<string, string[]> = {};
  for (const i of issues) (f[String(i.path.at(-1) ?? "form")] ??= []).push(i.message);
  return f;
};

/** Which service's fee is charged for each automatic stage (fees stay editable in the DB). Stage 3 is a staff quote. */
export const INTAKE_SERVICE_SLUG = "visa-guidance-session";
export const REVIEW_SERVICE_SLUG = "document-review";

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // keeps requests under serverless body limits
export const MAX_DOCS_PER_CASE = 20;
const MAX_OPEN_CASES = 5;

function gate(): { ok: false; status: number; error: string } | null {
  if (!portalEnabled()) return fail(503, "The client portal is not open yet.");
  if (!isDatabaseConfigured()) return fail(503, "The client portal is temporarily unavailable.");
  return null;
}

export type PublicClient = Pick<Client, "id" | "email" | "full_name">;
const pub = (c: Client): PublicClient => ({ id: c.id, email: c.email, full_name: c.full_name });

// ── accounts ────────────────────────────────────────────────────────────────

export async function registerClient(input: unknown, ctx: { ip: string }): Promise<Result<{ client: PublicClient }>> {
  const g = gate();
  if (g) return g;
  const repo = getRepo();
  if (!(await repo.hitRateLimit(`client:register:ip:${ctx.ip}`, 5, 3600))) return fail(429, "Too many attempts. Please try again later.");
  const p = clientRegisterSchema.safeParse(input);
  if (!p.success) return fail(422, "Please check the highlighted fields.", zodFields(p.error.issues));
  const v = p.data;
  if (v.website) return fail(422, "Please check the highlighted fields."); // honeypot
  try {
    const c = await repo.createClientAccount({ email: v.email, password_hash: await hashPassword(v.password), full_name: v.fullName, phone: v.phone ?? null });
    await sendVerificationEmail(c);
    return { ok: true, client: pub(c) };
  } catch (e) {
    if (e instanceof DuplicateEmailError) return fail(409, "An account with this email already exists. Please sign in.");
    throw e;
  }
}

export async function loginClient(input: unknown, ctx: { ip: string }): Promise<Result<{ client: PublicClient }>> {
  const g = gate();
  if (g) return g;
  const repo = getRepo();
  const p = clientLoginSchema.safeParse(input);
  if (!p.success) return fail(422, "Enter your email and password.");
  const email = p.data.email.toLowerCase();
  if (!(await repo.hitRateLimit(`client:login:ip:${ctx.ip}`, 10, 900)) || !(await repo.hitRateLimit(`client:login:email:${email}`, 8, 900))) return fail(429, "Too many attempts. Please try again in a few minutes.");
  const c = await repo.getClientByEmail(email);
  const ok = await verifyPassword(p.data.password, c?.password_hash ?? null);
  if (!c || !ok || !c.is_active) return fail(401, "Incorrect email or password.");
  await repo.recordClientLogin(c.id);
  return { ok: true, client: pub(c) };
}

// ── client: cases ───────────────────────────────────────────────────────────

export async function createCase(clientId: string, input: unknown): Promise<Result<{ caseId: string; reference: string }>> {
  const g = gate();
  if (g) return g;
  const repo = getRepo();
  const p = createCaseSchema.safeParse(input);
  if (!p.success) return fail(422, "Please choose a destination and purpose.", zodFields(p.error.issues));
  const [client, country, intake, mine] = await Promise.all([repo.getClientById(clientId), repo.getCountryBySlug(p.data.countrySlug), repo.getServiceBySlug(INTAKE_SERVICE_SLUG), repo.listCasesForClient(clientId)]);
  if (!client || !client.is_active) return fail(401, "Please sign in");
  if (verificationRequired() && !client.email_verified_at) return fail(403, "Please verify your email address first. Check your inbox, or use the resend button on your portal page.");
  if (!country || !country.is_active) return fail(422, "That destination is not available.", { countrySlug: ["Choose a destination"] });
  if (!intake || !intake.is_active || intake.fee_pkr <= 0) return fail(503, "This service is not available right now.");
  if (mine.filter((c) => !FINAL_STATUSES.includes(c.status)).length >= MAX_OPEN_CASES) return fail(409, "You already have several open cases. Please finish or cancel one first.");

  // The amount comes from the database row only — nothing from the browser.
  for (let i = 0; i < 5; i++) {
    try {
      const d = await repo.insertCase({ reference: generateCaseReference(), client_id: clientId, country_id: country.id, purpose: p.data.purpose, intake_amount_pkr: intake.fee_pkr });
      await repo.appendAudit({ booking_id: null, case_id: d.case.id, actor_id: clientId, actor_label: client.email, action: "case_created", from_value: null, to_value: d.case.status, meta: { country: country.slug, purpose: p.data.purpose, intakeFeePkr: intake.fee_pkr } });
      await notifyAdmins(`New case ${d.case.reference}`, `${client.email} opened a new ${p.data.purpose} case for ${country.slug}. Reference: ${d.case.reference}.`);
      return { ok: true, caseId: d.case.id, reference: d.case.reference };
    } catch (e) {
      if (!(e instanceof DuplicateReferenceError)) throw e;
    }
  }
  return fail(500, "Could not create your case. Please try again.");
}

/** Returns the case only if it belongs to this client (otherwise null → 404, never 403, so ids cannot be probed). */
export async function getClientCase(clientId: string, caseId: string): Promise<CaseDetail | null> {
  if (!isDatabaseConfigured()) return null;
  const d = await getRepo().getCaseDetail(caseId);
  return d && d.case.client_id === clientId ? d : null;
}

const payment = (d: CaseDetail, stage: CaseStage) => d.payments.find((p) => p.stage === stage);

async function audit(d: { case: Case }, actor: { id: string | null; label: string }, action: string, from: string | null, to: string | null, meta: Record<string, unknown> = {}) {
  await getRepo().appendAudit({ booking_id: null, case_id: d.case.id, actor_id: actor.id, actor_label: actor.label, action, from_value: from, to_value: to, meta });
}

export async function clientCaseAction(clientId: string, caseId: string, input: unknown): Promise<Result<{ detail: CaseDetail }>> {
  const g = gate();
  if (g) return g;
  const repo = getRepo();
  const p = clientCaseActionSchema.safeParse(input);
  if (!p.success) return fail(422, "Invalid request");
  const d = await getClientCase(clientId, caseId);
  if (!d) return fail(404, "Case not found");
  const actor = { id: clientId, label: d.client.email };
  const a = p.data;
  const status = d.case.status;

  switch (a.action) {
    case "mark_paid": {
      if (PAYING_STAGE[status] !== a.stage) return fail(409, "That payment is not due right now.");
      const pay = payment(d, a.stage);
      if (!pay || !canTransitionPayment(pay.status, "under_review")) return fail(409, "This payment is already being checked.");
      // The client's reference is a hint only; an admin verifies against the actual bank record.
      await repo.updateCasePayment(pay.id, { status: "under_review", client_reference: a.clientReference || pay.client_reference });
      await audit(d, actor, "payment_marked_paid", pay.status, "under_review", { stage: a.stage });
      break;
    }
    case "request_review": {
      if (status !== "documents_open") return fail(409, "Documents can only be sent for review while the case is at the upload step.");
      if (d.documents.length === 0) return fail(422, "Upload at least one document first.");
      if (d.documents.some((x) => x.status === "needs_fix")) return fail(422, "Please replace the documents marked 'needs fix' first.");
      const reviewPaid = payment(d, "review")?.status === "verified";
      if (reviewPaid) {
        // Returning after requested fixes: the review fee was already paid, so no second charge.
        if (!(await repo.updateCase(caseId, { status: "in_review" }, status))) return fail(409, "Case changed. Please refresh.");
        await audit(d, actor, "case_status_changed", status, "in_review", { via: "resubmitted_after_fixes" });
        break;
      }
      const svc = await repo.getServiceBySlug(REVIEW_SERVICE_SLUG);
      if (!svc || !svc.is_active || svc.fee_pkr <= 0) return fail(503, "Document review is not available right now.");
      if (!(await repo.updateCase(caseId, { status: "awaiting_review_payment" }, status))) return fail(409, "Case changed. Please refresh.");
      if (!payment(d, "review")) await repo.insertCasePayment({ case_id: caseId, stage: "review", amount_pkr: svc.fee_pkr });
      await audit(d, actor, "case_status_changed", status, "awaiting_review_payment", { reviewFeePkr: svc.fee_pkr });
      break;
    }
    case "accept_quote": {
      if (status !== "review_complete" || !d.case.submission_quote_pkr) return fail(409, "There is no quote to accept right now.");
      if (!(await repo.updateCase(caseId, { status: "awaiting_submission_payment" }, status))) return fail(409, "Case changed. Please refresh.");
      if (!payment(d, "submission")) await repo.insertCasePayment({ case_id: caseId, stage: "submission", amount_pkr: d.case.submission_quote_pkr });
      await audit(d, actor, "quote_accepted", status, "awaiting_submission_payment", { quotePkr: d.case.submission_quote_pkr });
      break;
    }
    case "cancel": {
      if (FINAL_STATUSES.includes(status)) return fail(409, "This case is already closed.");
      if (d.payments.some((x) => x.status === "verified" || x.status === "under_review")) return fail(409, "A payment has been made on this case. Please contact us to cancel.");
      if (!(await repo.updateCase(caseId, { status: "cancelled" }, status))) return fail(409, "Case changed. Please refresh.");
      await audit(d, actor, "case_status_changed", status, "cancelled", { by: "client" });
      break;
    }
  }
  return { ok: true, detail: (await repo.getCaseDetail(caseId))! };
}

// ── documents ───────────────────────────────────────────────────────────────

export function sniffMime(b: Uint8Array): { mime: CaseDocument["mime"]; ext: string } | null {
  if (b.length >= 5 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d) return { mime: "application/pdf", ext: "pdf" };
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return { mime: "image/png", ext: "png" };
  return null;
}

const cleanName = (n: string) => n.replace(/^.*[\\/]/, "").replace(/[\u0000-\u001f<>:"|?*]/g, "").trim().slice(0, 200) || "document";

export async function uploadDocument(clientId: string, caseId: string, meta: unknown, file: { name: string; bytes: Uint8Array }): Promise<Result<{ document: CaseDocument }>> {
  const g = gate();
  if (g) return g;
  if (!isStorageConfigured()) return fail(503, "Uploads are temporarily unavailable.");
  const repo = getRepo();
  const m = uploadMetaSchema.safeParse(meta);
  if (!m.success) return fail(422, "Choose what kind of document this is.");
  const d = await getClientCase(clientId, caseId);
  if (!d) return fail(404, "Case not found");
  if (!UPLOADS_OPEN.includes(d.case.status)) return fail(409, "Documents can be added at the upload step only (after the starting fee is confirmed).");
  if (file.bytes.length === 0) return fail(422, "That file is empty.");
  if (file.bytes.length > MAX_UPLOAD_BYTES) return fail(413, "File is too large. The limit is 4 MB — compress or rescan it.");
  if (d.documents.length >= MAX_DOCS_PER_CASE) return fail(409, `You can upload up to ${MAX_DOCS_PER_CASE} documents.`);
  if (!(await repo.hitRateLimit(`client:upload:${clientId}`, 40, 3600))) return fail(429, "Too many uploads. Please try again later.");
  const kind = sniffMime(file.bytes); // trust the bytes, never the declared type or the extension
  if (!kind) return fail(415, "Only PDF, JPG or PNG files are accepted.");

  const path = `${caseId}/${randomUUID()}.${kind.ext}`;
  const storage = getStorage();
  await storage.put(path, file.bytes, kind.mime);
  try {
    const doc = await repo.insertDocument({ case_id: caseId, doc_type: m.data.docType, original_name: cleanName(file.name), storage_path: path, mime: kind.mime, size_bytes: file.bytes.length });
    await audit(d, { id: clientId, label: d.client.email }, "document_uploaded", null, doc.doc_type, { documentId: doc.id, bytes: doc.size_bytes });
    return { ok: true, document: doc };
  } catch (e) {
    await storage.remove(path); // never leave an orphan file
    throw e;
  }
}

export async function deleteClientDocument(clientId: string, documentId: string): Promise<Result<object>> {
  const g = gate();
  if (g) return g;
  const repo = getRepo();
  const doc = await repo.getDocument(documentId);
  const d = doc ? await getClientCase(clientId, doc.case_id) : null;
  if (!doc || !d) return fail(404, "Document not found");
  if (!UPLOADS_OPEN.includes(d.case.status)) return fail(409, "Documents can only be removed at the upload step.");
  if (doc.status === "accepted") return fail(409, "Accepted documents cannot be removed.");
  await repo.deleteDocument(doc.id);
  await getStorage().remove(doc.storage_path);
  await audit(d, { id: clientId, label: d.client.email }, "document_deleted", doc.doc_type, null, { documentId: doc.id });
  return { ok: true };
}

/** Authorised read of a document's bytes. `owner` = the client id, or "staff" after the route has checked the permission. */
export async function readDocument(documentId: string, owner: string | "staff"): Promise<{ doc: CaseDocument; bytes: Uint8Array } | null> {
  if (!isDatabaseConfigured() || !isStorageConfigured()) return null;
  const repo = getRepo();
  const doc = await repo.getDocument(documentId);
  if (!doc) return null;
  if (owner !== "staff") {
    const d = await getClientCase(owner, doc.case_id);
    if (!d) return null;
  }
  const bytes = await getStorage().get(doc.storage_path);
  return bytes ? { doc, bytes } : null;
}

// ── admin ───────────────────────────────────────────────────────────────────

/** Actions that touch money need the admin-only payment permission (enforced by the route). */
export const ADMIN_MONEY_ACTIONS = new Set<AdminCaseAction["action"]>(["verify_payment", "reject_payment", "refund_payment"]);

export async function applyCaseAdminAction(caseId: string, input: unknown, actor: Actor): Promise<Result<{ detail: CaseDetail }>> {
  const repo = getRepo();
  const p = adminCaseActionSchema.safeParse(input);
  if (!p.success) return fail(422, p.error.issues[0]?.message ?? "Invalid request", zodFields(p.error.issues));
  const a = p.data;
  const d = await repo.getCaseDetail(caseId);
  if (!d) return fail(404, "Case not found");
  const who = { id: actor.id, label: actor.label };
  const status = d.case.status;
  const move = async (to: Case["status"], patch: Parameters<typeof repo.updateCase>[1] = {}) => {
    if (!canTransitionCase(status, to)) return false;
    return repo.updateCase(caseId, { ...patch, status: to }, status);
  };

  switch (a.action) {
    case "add_note":
      await audit(d, who, "note_added", null, null, { note: a.note });
      break;

    case "verify_payment": {
      if (PAYING_STAGE[status] !== a.stage) return fail(409, "That stage is not awaiting payment.");
      const pay = payment(d, a.stage);
      if (!pay) return fail(409, "No payment record for this stage.");
      if (pay.status !== "awaiting" && pay.status !== "under_review") return fail(409, `This payment is already "${pay.status}".`);
      // Verification rests on the actual bank record and an exact amount — never on a client's say-so or screenshot.
      if (a.receivedAmountPkr !== pay.amount_pkr) return fail(422, `Amount received (${a.receivedAmountPkr}) does not match the amount due (${pay.amount_pkr}). Leave it unverified and resolve the difference first.`);
      if (!actor.id) return fail(403, "Only a signed-in admin can verify payments.");
      await repo.updateCasePayment(pay.id, { status: "verified", bank_reference: a.bankReference, received_amount_pkr: a.receivedAmountPkr, verified_by: actor.id, verified_at: new Date().toISOString() });
      const next = NEXT_AFTER_PAYMENT[a.stage];
      if (!(await move(next))) return fail(409, "Payment recorded, but the case changed at the same time. Please refresh and check its status.");
      await audit(d, who, "payment_status_changed", pay.status, "verified", { stage: a.stage, bankReference: a.bankReference, receivedAmountPkr: a.receivedAmountPkr });
      await audit(d, who, "case_status_changed", status, next, { via: `payment_${a.stage}` });
      break;
    }

    case "reject_payment": {
      const pay = payment(d, a.stage);
      if (!pay || PAYING_STAGE[status] !== a.stage || pay.status !== "under_review") return fail(409, "Only a payment under review can be rejected.");
      await repo.updateCasePayment(pay.id, { status: "rejected" });
      await audit(d, who, "payment_status_changed", "under_review", "rejected", { stage: a.stage, note: a.note });
      break;
    }

    case "refund_payment": {
      const pay = payment(d, a.stage);
      if (status !== "cancelled") return fail(409, "Cancel the case before recording a refund.");
      if (!pay || pay.status !== "verified") return fail(409, "Only a verified payment can be refunded.");
      await repo.updateCasePayment(pay.id, { status: "refunded" });
      await audit(d, who, "payment_status_changed", "verified", "refunded", { stage: a.stage, ...(a.note ? { note: a.note } : {}) });
      break;
    }

    case "set_document_status": {
      if (status !== "in_review") return fail(409, "Documents are reviewed while the case is in review.");
      const doc = d.documents.find((x) => x.id === a.documentId);
      if (!doc) return fail(404, "Document not found on this case");
      if (a.status === "needs_fix" && !a.note) return fail(422, "Tell the client what needs fixing.");
      await repo.updateDocument(doc.id, { status: a.status, admin_note: a.note ?? null });
      await audit(d, who, "document_reviewed", doc.status, a.status, { documentId: doc.id, ...(a.note ? { note: a.note } : {}) });
      break;
    }

    case "request_fixes": {
      if (status !== "in_review") return fail(409, "Only a case in review can be sent back.");
      if (!d.documents.some((x) => x.status === "needs_fix")) return fail(422, "Mark at least one document as 'needs fix' first.");
      if (!(await move("documents_open"))) return fail(409, "Case changed. Please refresh.");
      await audit(d, who, "case_status_changed", status, "documents_open", { via: "fixes_requested", note: a.note });
      break;
    }

    case "complete_review": {
      if (status !== "in_review") return fail(409, "Only a case in review can be completed.");
      if (d.documents.length === 0 || d.documents.some((x) => x.status !== "accepted")) return fail(422, "Accept every document before completing the review (or send the case back for fixes).");
      if (!(await move("review_complete", { review_report: a.report, submission_quote_pkr: a.quotePkr, review_completed_at: new Date().toISOString() }))) return fail(409, "Case changed. Please refresh.");
      await audit(d, who, "case_status_changed", status, "review_complete", { quotePkr: a.quotePkr });
      break;
    }

    case "record_submission": {
      if (status !== "submission_in_progress") return fail(409, "The submission fee must be verified before the file is submitted.");
      if (!(await move("submitted", { submission_reference: a.reference, submission_notes: a.notes ?? null, submitted_at: new Date().toISOString() }))) return fail(409, "Case changed. Please refresh.");
      await audit(d, who, "case_status_changed", status, "submitted", { submissionReference: a.reference });
      break;
    }

    case "cancel": {
      if (!(CASE_TRANSITIONS[status] as string[]).includes("cancelled")) return fail(409, "This case is already closed.");
      if (!(await move("cancelled"))) return fail(409, "Case changed. Please refresh.");
      await audit(d, who, "case_status_changed", status, "cancelled", { note: a.note });
      break;
    }
  }
  const detail = (await repo.getCaseDetail(caseId))!;
  // Tell the client about real progress (never about internal notes). Best-effort: a failed email never fails the action.
  if (a.action !== "add_note") {
    void sendPlainEmail(d.client.email, `Update on your case ${d.case.reference}`, `Dear ${d.client.full_name},\n\nThere is an update on your case ${d.case.reference}. Its status is now: ${CASE_STATUS_LABEL[detail.case.status]}.\n\nSign in to your portal to see details and any next steps: ${siteUrl()}/portal/cases/${d.case.id}`).catch(() => {});
  }
  return { ok: true, detail };
}

export type { CasePayment };
