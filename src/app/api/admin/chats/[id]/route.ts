import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { teamReply } from "@/lib/chat";
import { getRepo } from "@/lib/repo";
import { bodyErrorResponse, isSameOrigin, json, jsonError, readJson } from "@/lib/security";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  const session = await requireAdmin(req, "lead:manage");
  if (session instanceof Response) return session;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return jsonError(404, "Not found");
  let body: unknown;
  try { body = await readJson(req, 4_000); } catch (e) { return bodyErrorResponse(e) ?? jsonError(400, "Bad request"); }
  try {
    const r = await teamReply(id, body);
    if (!r.ok) return jsonError(r.status, r.error);
    await getRepo().appendAudit({ booking_id: null, actor_id: session.sub, actor_label: session.email, action: "chat_reply", from_value: null, to_value: null, meta: { threadId: id } });
    return json({ ok: true, messages: r.messages });
  } catch (e) {
    console.error("[POST /api/admin/chats]", e);
    return jsonError(500, "Something went wrong");
  }
}

const patch = z.strictObject({ status: z.enum(["open", "closed"]).optional(), read: z.literal(true).optional() });
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  const session = await requireAdmin(req, "lead:manage");
  if (session instanceof Response) return session;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return jsonError(404, "Not found");
  let body: unknown;
  try { body = await readJson(req, 1_000); } catch (e) { return bodyErrorResponse(e) ?? jsonError(400, "Bad request"); }
  const p = patch.safeParse(body);
  if (!p.success) return jsonError(422, "Invalid request");
  try {
    await getRepo().updateChatThread(id, { ...(p.data.status ? { status: p.data.status } : {}), ...(p.data.read ? { unread_admin: false } : {}) });
    return json({ ok: true });
  } catch (e) {
    console.error("[PATCH /api/admin/chats]", e);
    return jsonError(500, "Something went wrong");
  }
}
