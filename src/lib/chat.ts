import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { notifyAdmins } from "./email";
import { isDatabaseConfigured, getRepo } from "./repo";
import type { ChatMessage } from "./types";
import type { Result } from "./bookings";

const fail = (status: number, error: string, fields?: Record<string, string[]>) => ({ ok: false as const, status, error, fields });
export const CHAT_COOKIE = "chat_token";

const hash = (token: string) => createHash("sha256").update(token).digest("hex");
const body = z.string().trim().min(1, "Please type a message").max(1000);
const startSchema = z.strictObject({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  contact: z.string().trim().max(40).regex(/^[0-9+\s\-()]*$/, "Use digits only for the phone / WhatsApp number").optional().default(""),
  message: body,
  landing: z.string().trim().max(60).optional(),
  website: z.string().max(200).optional().default(""),
});
const sendSchema = z.strictObject({ message: body });

const publicMsg = (m: ChatMessage) => ({ id: m.id, sender: m.sender, body: m.body, at: m.created_at });
export type PublicChatMessage = ReturnType<typeof publicMsg>;

function gate() {
  if (!isDatabaseConfigured()) return fail(503, "Chat is temporarily unavailable. Please use WhatsApp or the contact form.");
  return null;
}

/** Starts a thread. The visitor keeps a random token (cookie); only its hash is stored. */
export async function startChat(input: unknown, ctx: { ip: string }): Promise<Result<{ token: string; messages: PublicChatMessage[] }>> {
  const g = gate();
  if (g) return g;
  const repo = getRepo();
  if (!(await repo.hitRateLimit(`chat:start:${ctx.ip}`, 5, 3600))) return fail(429, "Too many chats started. Please try again later.");
  const p = startSchema.safeParse(input);
  if (!p.success) {
    const fields: Record<string, string[]> = {};
    for (const i of p.error.issues) (fields[String(i.path.at(-1) ?? "form")] ??= []).push(i.message);
    return fail(422, "Please check the highlighted fields.", fields);
  }
  if (p.data.website) return { ok: true, token: randomBytes(24).toString("hex"), messages: [] }; // honeypot
  const token = randomBytes(24).toString("hex");
  const t = await repo.createChatThread({ token_hash: hash(token), visitor_name: p.data.name, visitor_contact: p.data.contact || null, landing: p.data.landing ?? null });
  const m = await repo.addChatMessage(t.id, "visitor", p.data.message);
  await notifyAdmins("New website chat", `${p.data.name}${p.data.contact ? ` (${p.data.contact})` : ""} started a chat. Open Chats in the admin panel to reply.`);
  return { ok: true, token, messages: [publicMsg(m)] };
}

async function threadFor(token: string | undefined) {
  if (!token || !/^[0-9a-f]{48}$/.test(token)) return null;
  return getRepo().getChatThreadByTokenHash(hash(token));
}

export async function visitorSend(token: string | undefined, input: unknown, ctx: { ip: string }): Promise<Result<{ messages: PublicChatMessage[] }>> {
  const g = gate();
  if (g) return g;
  const repo = getRepo();
  const t = await threadFor(token);
  if (!t) return fail(404, "Chat not found. Please start a new one.");
  if (!(await repo.hitRateLimit(`chat:send:${t.id}`, 30, 3600)) || !(await repo.hitRateLimit(`chat:ip:${ctx.ip}`, 60, 3600))) return fail(429, "You are sending messages too quickly. Please wait a little.");
  const p = sendSchema.safeParse(input);
  if (!p.success) return fail(422, p.error.issues[0]?.message ?? "Invalid message");
  await repo.addChatMessage(t.id, "visitor", p.data.message);
  if (await repo.hitRateLimit(`chat:notify:${t.id}`, 1, 600)) await notifyAdmins("New chat message", `${t.visitor_name} sent a new message in website chat.`);
  return { ok: true, messages: (await repo.listChatMessages(t.id)).map(publicMsg) };
}

export async function visitorPoll(token: string | undefined): Promise<Result<{ messages: PublicChatMessage[]; closed: boolean }>> {
  const g = gate();
  if (g) return g;
  const t = await threadFor(token);
  if (!t) return fail(404, "Chat not found");
  return { ok: true, messages: (await getRepo().listChatMessages(t.id)).map(publicMsg), closed: t.status === "closed" };
}

export async function teamReply(threadId: string, input: unknown): Promise<Result<{ messages: ChatMessage[] }>> {
  const repo = getRepo();
  const t = await repo.getChatThread(threadId);
  if (!t) return fail(404, "Chat not found");
  const p = sendSchema.safeParse(input);
  if (!p.success) return fail(422, p.error.issues[0]?.message ?? "Invalid message");
  await repo.addChatMessage(t.id, "team", p.data.message);
  await repo.updateChatThread(t.id, { unread_admin: false, status: "open" });
  return { ok: true, messages: await repo.listChatMessages(t.id) };
}
