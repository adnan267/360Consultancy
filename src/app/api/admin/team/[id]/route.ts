import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actorOf, requireAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/repo";
import { bodyErrorResponse, isSameOrigin, json, jsonError, readJson } from "@/lib/security";
import { teamPatchSchema } from "@/lib/validation";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  const s = await requireAdmin(req, "team:manage");
  if (s instanceof Response) return s;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return jsonError(404, "Not found");
  let body: unknown;
  try { body = await readJson(req, 1_000); } catch (e) { return bodyErrorResponse(e) ?? jsonError(400, "Bad request"); }
  const p = teamPatchSchema.safeParse(body);
  if (!p.success || !Object.keys(p.data).length) return jsonError(422, "Invalid request");
  try {
    const repo = getRepo();
    const target = await repo.getAdminById(id);
    if (!target) return jsonError(404, "Not found");
    const losesAdmin = (p.data.role && p.data.role !== "admin" && target.role === "admin") || p.data.is_active === false;
    if (id === s.sub && losesAdmin) return jsonError(409, "You cannot remove your own admin access or deactivate yourself.");
    if (target.role === "admin" && target.is_active && losesAdmin) {
      const activeAdmins = (await repo.listAdmins()).filter((a) => a.role === "admin" && a.is_active).length;
      if (activeAdmins <= 1) return jsonError(409, "At least one active Super Admin must remain.");
    }
    await repo.updateAdmin(id, p.data);
    await repo.appendAudit({ booking_id: null, actor_id: s.sub, actor_label: s.email, action: "team_updated", from_value: target.role, to_value: p.data.role ?? null, meta: { target: target.email, ...p.data } });
    return json({ ok: true });
  } catch (e) {
    console.error("[PATCH /api/admin/team/:id]", e);
    return jsonError(500, "Something went wrong");
  }
}
