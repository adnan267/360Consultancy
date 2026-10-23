import { clientIp, isSameOrigin, json, jsonError, readJson, bodyErrorResponse } from "@/lib/security";
import { loginClient } from "@/lib/cases";
import { serializeClientCookie, signClientSession } from "@/lib/client-auth";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  let body: unknown;
  try { body = await readJson(req, 2_000); } catch (e) { return bodyErrorResponse(e) ?? jsonError(400, "Bad request"); }
  try {
    const r = await loginClient(body, { ip: clientIp(req) });
    if (!r.ok) return jsonError(r.status, r.error);
    const token = await signClientSession({ sub: r.client.id, email: r.client.email });
    return json({ ok: true }, 200, { "Set-Cookie": serializeClientCookie(token) });
  } catch (e) {
    console.error("[POST /api/portal/login]", e);
    return jsonError(500, "Something went wrong. Please try again.");
  }
}
