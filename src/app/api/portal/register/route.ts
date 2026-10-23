import { clientIp, isSameOrigin, json, jsonError, readJson, bodyErrorResponse } from "@/lib/security";
import { registerClient } from "@/lib/cases";
import { serializeClientCookie, signClientSession } from "@/lib/client-auth";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  let body: unknown;
  try { body = await readJson(req, 4_000); } catch (e) { return bodyErrorResponse(e) ?? jsonError(400, "Bad request"); }
  try {
    const r = await registerClient(body, { ip: clientIp(req) });
    if (!r.ok) return json({ ok: false, error: r.error, fields: r.fields }, r.status);
    const token = await signClientSession({ sub: r.client.id, email: r.client.email });
    return json({ ok: true }, 201, { "Set-Cookie": serializeClientCookie(token) });
  } catch (e) {
    console.error("[POST /api/portal/register]", e);
    return jsonError(500, "Something went wrong. Please try again.");
  }
}
