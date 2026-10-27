import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actorOf, requireAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/repo";
import { bodyErrorResponse, isSameOrigin, json, jsonError, readJson } from "@/lib/security";
import { staffSendMessage } from "@/lib/cms";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  const s = await requireAdmin(req, "case:message");
  if (s instanceof Response) return s;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return jsonError(404, "Not found");
  let body: unknown;
  try { body = await readJson(req, 4_000); } catch (e) { return bodyErrorResponse(e) ?? jsonError(400, "Bad request"); }
  try {
    const r = await staffSendMessage(actorOf(s) as { id: string; label: string }, id, body);
    if (!r.ok) return jsonError(r.status, r.error);
    return json({ ok: true });
  } catch (e) {
    console.error("[POST /api/admin/cases/:id/messages]", e);
    return jsonError(500, "Something went wrong");
  }
}
