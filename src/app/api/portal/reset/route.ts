import { resetPassword } from "@/lib/account";
import { bodyErrorResponse, clientIp, isSameOrigin, json, jsonError, readJson } from "@/lib/security";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  let body: unknown;
  try { body = await readJson(req, 2_000); } catch (e) { return bodyErrorResponse(e) ?? jsonError(400, "Bad request"); }
  try {
    const r = await resetPassword(body, clientIp(req));
    if (!r.ok) return jsonError(r.status, r.error);
    const { ok: _ok, ...rest } = r;
    return json({ ok: true, ...rest });
  } catch (e) {
    console.error("[POST /api/portal/reset]", e);
    return jsonError(500, "Something went wrong. Please try again.");
  }
}
