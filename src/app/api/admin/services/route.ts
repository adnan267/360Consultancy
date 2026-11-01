import { requireAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/repo";
import { bodyErrorResponse, isSameOrigin, json, jsonError, readJson } from "@/lib/security";
import { newServiceSchema } from "@/lib/validation";

/** Add a new service. It starts inactive unless the admin switches it on. */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  const session = await requireAdmin(req, "service:manage");
  if (session instanceof Response) return session;
  let body: unknown;
  try { body = await readJson(req, 8_000); } catch (e) { return bodyErrorResponse(e) ?? jsonError(400, "Bad request"); }
  const p = newServiceSchema.safeParse(body);
  if (!p.success) return jsonError(422, p.error.issues[0] ? `${p.error.issues[0].path.join(".") || "Field"}: ${p.error.issues[0].message}` : "Invalid request");
  try {
    const repo = getRepo();
    const created = await repo.createService(p.data);
    if (!created) return jsonError(409, "A service with this URL name already exists");
    await repo.appendAudit({ booking_id: null, actor_id: session.sub, actor_label: session.email, action: "service_created", from_value: null, to_value: created.slug, meta: { fee_pkr: created.fee_pkr, active: created.is_active } });
    return json({ ok: true, service: created }, 201);
  } catch (e) {
    console.error("[POST /api/admin/services]", e);
    return jsonError(500, "Something went wrong");
  }
}
