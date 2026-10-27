import { beforeEach, describe, expect, it, vi } from "vitest";
import { verifyEmail } from "@/lib/account";
import { applyCaseAdminAction, createCase, deleteDeliverable, readDeliverable, registerClient, uploadDeliverable } from "@/lib/cases";
import type { MemoryRepo } from "@/lib/repo";
import { MemoryStorage, setStorageForTests } from "@/lib/storage";
import { captureEmail, freshRepo, type CapturingEmail } from "./helpers";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn(), unstable_cache: <T extends (...a: never[]) => unknown>(fn: T) => fn }));

const staff = { id: "11111111-1111-4111-8111-111111111111", label: "staff@example.com", role: "staff" as const };
const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25]);
let repo: MemoryRepo;
let mail: CapturingEmail;
let clientId: string;
let otherId: string;
let caseId: string;

async function reg(email: string) {
  const r = await registerClient({ fullName: "Sana Malik", email, password: "correct horse battery", consentPrivacy: true, consentTerms: true }, { ip: "2.2.2.2" });
  if (!r.ok) throw new Error(r.error);
  await verifyEmail({ token: /token=([\w-]+)/.exec(mail.sent.at(-1)!.text)![1] }, "2.2.2.2");
  return r.client.id;
}

beforeEach(async () => {
  repo = freshRepo();
  setStorageForTests(new MemoryStorage());
  mail = captureEmail();
  Object.assign(process.env, { SERVICES_ENABLED: "true", PORTAL_ENABLED: "true" });
  clientId = await reg("a@example.com");
  otherId = await reg("b@example.com");
  const c = await createCase(clientId, { countrySlug: "canada", purpose: "study" });
  if (!c.ok) throw new Error(c.error);
  caseId = c.caseId;
});
const setStatus = (s: string) => { repo.cases.find((c) => c.id === caseId)!.status = s as never; };

describe("deliverables, handover and decision", () => {
  it("only accepts final files once the review is complete, and only real PDFs/images", async () => {
    expect(await uploadDeliverable(staff, caseId, { name: "a.pdf", bytes: PDF })).toMatchObject({ ok: false, status: 409 });
    setStatus("review_complete");
    expect(await uploadDeliverable(staff, caseId, { name: "evil.pdf", bytes: new TextEncoder().encode("<script>alert(1)</script>") })).toMatchObject({ ok: false, status: 415 });
    expect(await uploadDeliverable(staff, caseId, { name: "report.pdf", bytes: PDF })).toMatchObject({ ok: true });
  });

  it("only the owning client can download a final file", async () => {
    setStatus("review_complete");
    const r = await uploadDeliverable(staff, caseId, { name: "report.pdf", bytes: PDF });
    if (!r.ok) throw new Error(r.error);
    expect(await readDeliverable(r.deliverable.id, clientId)).not.toBeNull();
    expect(await readDeliverable(r.deliverable.id, otherId)).toBeNull();
    expect(await readDeliverable(r.deliverable.id, "staff")).not.toBeNull();
  });

  it("handover needs at least one file, closes the case and records the date", async () => {
    setStatus("review_complete");
    expect(await applyCaseAdminAction(caseId, { action: "complete_case" }, staff)).toMatchObject({ ok: false, status: 422 });
    await uploadDeliverable(staff, caseId, { name: "report.pdf", bytes: PDF });
    expect(await applyCaseAdminAction(caseId, { action: "complete_case", notes: "Next: book your appointment" }, staff)).toMatchObject({ ok: true });
    const c = (await repo.getCaseDetail(caseId))!.case;
    expect(c).toMatchObject({ status: "completed", handover_notes: "Next: book your appointment" });
    expect(c.handover_at).not.toBeNull();
    expect(await uploadDeliverable(staff, caseId, { name: "late.pdf", bytes: PDF })).toMatchObject({ ok: false, status: 409 });
  });

  it("the official decision is separate: needs a recorded submission and a source note", async () => {
    setStatus("review_complete");
    expect(await applyCaseAdminAction(caseId, { action: "record_decision", decision: "approved", note: "Decision letter 1 Nov" }, staff)).toMatchObject({ ok: false, status: 409 });
    setStatus("submitted");
    repo.cases.find((c) => c.id === caseId)!.submitted_at = new Date().toISOString();
    expect(await applyCaseAdminAction(caseId, { action: "record_decision", decision: "approved", note: "x" }, staff)).toMatchObject({ ok: false, status: 422 });
    expect(await applyCaseAdminAction(caseId, { action: "record_decision", decision: "approved", note: "Decision letter 1 Nov" }, staff)).toMatchObject({ ok: true });
    const c = (await repo.getCaseDetail(caseId))!.case;
    expect(c.decision).toBe("approved");
    expect(c.status).toBe("submitted"); // consultancy completion is untouched
  });

  it("files cannot be removed after handover", async () => {
    setStatus("review_complete");
    const r = await uploadDeliverable(staff, caseId, { name: "report.pdf", bytes: PDF });
    if (!r.ok) throw new Error(r.error);
    await applyCaseAdminAction(caseId, { action: "complete_case" }, staff);
    expect(await deleteDeliverable(staff, r.deliverable.id)).toMatchObject({ ok: false, status: 409 });
  });
});
