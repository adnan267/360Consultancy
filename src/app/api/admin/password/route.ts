import { hashPassword, requireAdmin, verifyPassword } from "@/lib/auth";
import { getRepo } from "@/lib/repo";
import { bodyErrorResponse, isSameOrigin, json, jsonError, readJson } from "@/lib/security";
import { changePasswordSchema } from "@/lib/validation";

/** Any signed-in admin/staff user may change their own password (never someone else's). */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  const session = await requireAdmin(req, "booking:view");
  if (session instanceof Response) return session;

  let body: unknown;
  try {
    body = await readJson(req, 2_000);
  } catch (e) {
    return bodyErrorResponse(e) ?? jsonError(400, "Bad request");
  }
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, parsed.error.issues[0]?.message ?? "Invalid request");
  const { current_password, new_password } = parsed.data;
  if (current_password === new_password) return jsonError(400, "New password must be different from the current one");

  const repo = getRepo();
  if (!(await repo.hitRateLimit(`pwchange:${session.sub}`, 5, 900))) return jsonError(429, "Too many attempts. Please wait 15 minutes and try again.");

  const admin = await repo.getAdminByEmail(session.email);
  if (!admin || !admin.is_active || admin.id !== session.sub) return jsonError(403, "Forbidden");
  if (!(await verifyPassword(current_password, admin.password_hash))) {
    await repo.appendAudit({ booking_id: null, actor_id: admin.id, actor_label: admin.email, action: "admin_password_change_failed", from_value: null, to_value: null, meta: {} });
    return jsonError(400, "Current password is incorrect");
  }
  await repo.setAdminPassword(admin.id, await hashPassword(new_password));
  await repo.appendAudit({ booking_id: null, actor_id: admin.id, actor_label: admin.email, action: "admin_password_changed", from_value: null, to_value: null, meta: {} });
  return json({ ok: true });
}
