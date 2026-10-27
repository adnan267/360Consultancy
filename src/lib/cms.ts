import { sendPlainEmail, notifyAdmins } from "./email";
import { siteUrl } from "./env";
import type { Result } from "./bookings";
import { FAQS } from "@/data/faq";
import { getRepo, isDatabaseConfigured } from "./repo";
import type { BlogPost, Faq } from "./types";
import { caseMessageSchema, dataRequestSchema, staffMessageSchema } from "./validation";

const fail = (status: number, error: string) => ({ ok: false as const, status, error });

// ── public reads (fall back to built-in content so pages never hard-fail) ──
export async function getPublicFaqs(): Promise<{ q: string; a: string }[]> {
  if (isDatabaseConfigured()) {
    try {
      const rows = await getRepo().listFaqs({ publishedOnly: true });
      if (rows.length) return rows.map((f) => ({ q: f.question, a: f.answer }));
    } catch (e) {
      console.error("[cms] faqs fallback", e);
    }
  }
  return FAQS;
}

export async function getPublishedPosts(limit = 50): Promise<BlogPost[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    return await getRepo().listBlogPosts({ publishedOnly: true, limit });
  } catch (e) {
    console.error("[cms] posts", e);
    return [];
  }
}

export async function getPublishedPost(slug: string): Promise<BlogPost | null> {
  if (!isDatabaseConfigured() || !/^[a-z0-9-]{1,80}$/.test(slug)) return null;
  try {
    return await getRepo().getBlogPost({ slug }, { publishedOnly: true });
  } catch {
    return null;
  }
}

export async function seedDefaultFaqs(): Promise<number> {
  const repo = getRepo();
  if ((await repo.listFaqs()).length) return 0;
  let n = 0;
  for (const f of FAQS) await repo.saveFaq({ question: f.q, answer: f.a, sort_order: (++n) * 10 });
  return n;
}

// ── case messages ──
export async function clientSendMessage(clientId: string, caseId: string, input: unknown): Promise<Result<object>> {
  if (!isDatabaseConfigured()) return fail(503, "Messaging is temporarily unavailable.");
  const repo = getRepo();
  const p = caseMessageSchema.safeParse(input);
  if (!p.success) return fail(422, p.error.issues[0]?.message ?? "Write a message");
  if (!(await repo.hitRateLimit(`msg:client:${clientId}`, 20, 3600))) return fail(429, "You are sending messages too quickly. Please try again later.");
  const d = await repo.getCaseDetail(caseId);
  if (!d || d.case.client_id !== clientId) return fail(404, "Case not found");
  await repo.addCaseMessage({ case_id: caseId, sender: "client", sender_label: d.client.full_name, body: p.data.body, internal: false });
  await notifyAdmins(`New client message on ${d.case.reference}`, `A client wrote on case ${d.case.reference}. Open the case in the admin panel to read and reply.`);
  return { ok: true };
}

export async function staffSendMessage(actor: { id: string; label: string }, caseId: string, input: unknown): Promise<Result<object>> {
  const repo = getRepo();
  const p = staffMessageSchema.safeParse(input);
  if (!p.success) return fail(422, p.error.issues[0]?.message ?? "Write a message");
  const d = await repo.getCaseDetail(caseId);
  if (!d) return fail(404, "Case not found");
  await repo.addCaseMessage({ case_id: caseId, sender: "staff", sender_label: "360 Consultancy", body: p.data.body, internal: p.data.internal });
  await repo.appendAudit({ booking_id: null, case_id: caseId, actor_id: actor.id, actor_label: actor.label, action: p.data.internal ? "internal_note_added" : "message_sent", from_value: null, to_value: null, meta: {} });
  if (!p.data.internal) {
    void sendPlainEmail(d.client.email, `New message on your case ${d.case.reference}`, `Dear ${d.client.full_name},\n\nYou have a new message from 360 Consultancy on case ${d.case.reference}. Sign in to read it: ${siteUrl()}/portal/cases/${d.case.id}`).catch(() => {});
  }
  return { ok: true };
}

// ── data requests ──
export async function createDataRequest(clientId: string, input: unknown): Promise<Result<object>> {
  if (!isDatabaseConfigured()) return fail(503, "Requests are temporarily unavailable.");
  const repo = getRepo();
  const p = dataRequestSchema.safeParse(input);
  if (!p.success) return fail(422, "Choose a request type.");
  if (!(await repo.hitRateLimit(`datareq:${clientId}`, 3, 86_400))) return fail(429, "You have already made requests today. We will respond soon.");
  await repo.insertDataRequest({ client_id: clientId, kind: p.data.kind, note: p.data.note ?? null });
  await notifyAdmins("New data request", `A client submitted a data ${p.data.kind} request. Review it under Data requests in the admin panel.`);
  return { ok: true };
}

export type { Faq };
