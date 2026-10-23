import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/repo";
import { bodyErrorResponse, isSameOrigin, json, jsonError, readJson } from "@/lib/security";
import { servicePatchSchema } from "@/lib/validation";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  const session = await requireAdmin(req, "service:manage");
  if (session instanceof Response) return session;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return jsonError(404, "Not found");

  let body: unknown;
  try {
    body = await readJson(req, 4_000);
  } catch (e) {
    return bodyErrorResponse(e) ?? jsonError(400, "Bad request");
  }
  const parsed = servicePatchSchema.safeParse(body);
  if (!parsed.success || Object.keys(parsed.data).length === 0) return jsonError(422, "Invalid request");

  try {
    const repo = getRepo();
    const updated = await repo.updateService(id, parsed.data);
    if (!updated) return jsonError(404, "Not found");
    await repo.appendAudit({ booking_id: null, actor_id: session.sub, actor_label: session.email, action: "service_updated", from_value: null, to_value: updated.slug, meta: { changes: parsed.data } });
    return json({ ok: true, service: updated });
  } catch (e) {
    console.error("[PATCH /api/admin/services]", e);
    return jsonError(500, "Something went wrong");
  }
}
