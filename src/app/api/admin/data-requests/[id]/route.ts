import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actorOf, requireAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/repo";
import { bodyErrorResponse, isSameOrigin, json, jsonError, readJson } from "@/lib/security";
import { dataRequestPatchSchema } from "@/lib/validation";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  const s = await requireAdmin(req, "team:manage");
  if (s instanceof Response) return s;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return jsonError(404, "Not found");
  let body: unknown;
  try { body = await readJson(req, 500); } catch (e) { return bodyErrorResponse(e) ?? jsonError(400, "Bad request"); }
  const p = dataRequestPatchSchema.safeParse(body);
  if (!p.success) return jsonError(422, "Invalid request");
  try {
    const r = await getRepo().setDataRequestStatus(id, p.data.status);
    if (!r) return jsonError(404, "Not found");
    await getRepo().appendAudit({ booking_id: null, actor_id: s.sub, actor_label: s.email, action: "data_request_handled", from_value: null, to_value: p.data.status, meta: { kind: r.kind } });
    return json({ ok: true });
  } catch (e) {
    console.error("[PATCH /api/admin/data-requests/:id]", e);
    return jsonError(500, "Something went wrong");
  }
}
