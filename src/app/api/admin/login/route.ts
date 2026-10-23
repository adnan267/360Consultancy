import { serializeSessionCookie, signSession, verifyPassword } from "@/lib/auth";
import { getRepo, isDatabaseConfigured } from "@/lib/repo";
import { bodyErrorResponse, clientIp, isSameOrigin, json, jsonError, readJson } from "@/lib/security";
import { loginSchema } from "@/lib/validation";

const GENERIC = "Invalid email or password";

export async function POST(req: Request) {
  try {
    return await handle(req);
  } catch (e) {
    // TEMP diagnostics: message only (no secrets); remove after setup is verified.
    console.error("admin login failed", e);
    return jsonError(500, `Server error: ${e instanceof Error ? e.message.slice(0, 200) : "unknown"}`);
  }
}

async function handle(req: Request) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  if (!isDatabaseConfigured()) return jsonError(503, "Admin sign-in is not available until the database is configured.");
  let body: unknown;
  try {
    body = await readJson(req, 2_000);
  } catch (e) {
    return bodyErrorResponse(e) ?? jsonError(400, "Bad request");
  }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, GENERIC);
  const { email, password } = parsed.data;

  const repo = getRepo();
  const ip = clientIp(req);
  // 10 attempts / 15 min per IP, 5 / 15 min per account. Limiter failure = deny.
  if (!(await repo.hitRateLimit(`login:ip:${ip}`, 10, 900)) || !(await repo.hitRateLimit(`login:email:${email}`, 5, 900))) {
    return jsonError(429, "Too many attempts. Please wait 15 minutes and try again.");
  }

  const admin = await repo.getAdminByEmail(email);
  const ok = await verifyPassword(password, admin?.is_active ? admin.password_hash : null);
  if (!admin || !admin.is_active || !ok) {
    await repo.appendAudit({ booking_id: null, actor_id: null, actor_label: "anonymous", action: "admin_login_failed", from_value: null, to_value: null, meta: { ip } });
    return jsonError(401, GENERIC);
  }

  await repo.recordAdminLogin(admin.id);
  await repo.appendAudit({ booking_id: null, actor_id: admin.id, actor_label: admin.email, action: "admin_login", from_value: null, to_value: null, meta: { ip } });
  const token = await signSession({ sub: admin.id, email: admin.email, role: admin.role });
  return json({ ok: true }, 200, { "Set-Cookie": serializeSessionCookie(token) });
}
