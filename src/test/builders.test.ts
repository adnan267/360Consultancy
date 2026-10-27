import { beforeEach, describe, expect, it, vi } from "vitest";
import { createLead } from "@/lib/leads";
import { notifyClient, renderTemplate } from "@/lib/notifications";
import type { MemoryRepo } from "@/lib/repo";
import { captureEmail, freshRepo, type CapturingEmail } from "./helpers";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn(), unstable_cache: <T extends (...a: never[]) => unknown>(fn: T) => fn }));

let repo: MemoryRepo;
let mail: CapturingEmail;
const contact = { name: "Sana Malik", email: "s@example.com", phone: "", consentPrivacy: true, website: "" };
const answers = { purpose: "study", destination: "canada", educationLevel: "bachelor", targetLevel: "master", englishTest: "have", budgetBand: "unsure", fundingSource: "self", timeline: "flexible" };

beforeEach(() => { repo = freshRepo(); mail = captureEmail(); process.env.LEADS_ENABLED = "true"; });

describe("extra wizard questions", () => {
  it("stores answers with the question text, enforces required, options and purpose", async () => {
    const req = await repo.saveWizardQuestion({ label: "Travelled abroad before?", help: null, kind: "yesno", options: [], purpose: null, required: true, sort_order: 1, is_active: true });
    const work = await repo.saveWizardQuestion({ label: "Employer name", help: null, kind: "text", options: [], purpose: "work", required: true, sort_order: 2, is_active: true });
    const off = await repo.saveWizardQuestion({ label: "Hidden", help: null, kind: "text", options: [], purpose: null, required: true, sort_order: 3, is_active: false });
    expect(await createLead({ answers, contact }, { ip: "1.1.1.1" })).toMatchObject({ ok: false, status: 422 });
    expect(await createLead({ answers, contact, extra: { [req!.id]: "Maybe" } }, { ip: "1.1.1.2" })).toMatchObject({ ok: false, status: 422 });
    const ok = await createLead({ answers, contact: { ...contact, email: "t@example.com" }, extra: { [req!.id]: "Yes", [work!.id]: "ignored", [off!.id]: "ignored" } }, { ip: "1.1.1.3" });
    expect(ok).toMatchObject({ ok: true });
    const lead = repo.leads.at(-1)!;
    expect(lead.answers.extra_answers).toEqual([{ question: "Travelled abroad before?", answer: "Yes" }]);
  });
});

describe("email templates and notifications", () => {
  it("renders only known placeholders", () => {
    expect(renderTemplate("Hi {{name}} {{nope}}!", { name: "Sana" })).toBe("Hi Sana !");
  });
  it("uses the admin template when saved, falls back to the default, and records a notification", async () => {
    const vars = { name: "Sana", reference: "R-1", status: "Under review" };
    await notifyClient({ clientId: "c1", clientEmail: "s@example.com", caseId: null, templateKey: "case_status", title: "t", vars, link: "https://x/y" });
    expect(mail.sent.at(-1)!.text).toContain("Under review");
    await repo.saveEmailTemplate("case_status", "Custom {{reference}}", "Salam {{name}}, see {{link}}");
    await notifyClient({ clientId: "c1", clientEmail: "s@example.com", caseId: null, templateKey: "case_status", title: "t2", vars, link: "https://x/y" });
    expect(mail.sent.at(-1)).toMatchObject({ subject: "Custom R-1" });
    expect(mail.sent.at(-1)!.text).toContain("Salam Sana, see https://x/y");
    const list = await repo.listNotifications("c1");
    expect(list).toHaveLength(2);
    await repo.markNotificationsRead("c1");
    expect((await repo.listNotifications("c1")).every((n) => n.read_at)).toBe(true);
    expect(await repo.listNotifications("other")).toHaveLength(0);
  });
});
