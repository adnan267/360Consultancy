import { z } from "zod";
import { actorOf, requireAdmin } from "@/lib/auth";
import { ADMIN_MONEY_ACTIONS, applyCaseAdminAction } from "@/lib/cases";
import { can } from "@/lib/status";
import { bodyErrorResponse, isSameOrigin, json, jsonError, readJson } from "@/lib/security";
import type { AdminCaseAction } from "@/lib/validation";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  const s = await requireAdmin(req, "case:manage");
  if (s instanceof Response) return s;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return jsonError(404, "Not found");
  let body: unknown;
  try { body = await readJson(req, 12_000); } catch (e) { return bodyErrorResponse(e) ?? jsonError(400, "Bad request"); }
  // Money actions are admin-only; staff cannot verify, reject or refund payments.
  const action = (body as { action?: AdminCaseAction["action"] } | null)?.action;
  if (action && ADMIN_MONEY_ACTIONS.has(action) && !can(s.role, "payment:verify")) return jsonError(403, "You do not have permission to do this");
  if (action && !ADMIN_MONEY_ACTIONS.has(action) && !can(s.role, "document:view")) return jsonError(403, "You do not have permission to do this");
  try {
    const r = await applyCaseAdminAction(id, body, actorOf(s));
    if (!r.ok) return json({ ok: false, error: r.error, fields: r.fields }, r.status);
    return json({ ok: true });
  } catch (e) {
    console.error("[PATCH /api/admin/cases]", e);
    return jsonError(500, "Something went wrong.");
  }
}
