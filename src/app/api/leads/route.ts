import { createLead } from "@/lib/leads";
import { bodyErrorResponse, clientIp, isSameOrigin, json, jsonError, readJson } from "@/lib/security";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  let body: unknown;
  try {
    body = await readJson(req, 8_000);
  } catch (e) {
    return bodyErrorResponse(e) ?? jsonError(400, "Bad request");
  }
  try {
    const r = await createLead(body, { ip: clientIp(req) });
    if (!r.ok) return json({ ok: false, error: r.error, fields: r.fields }, r.status);
    return json({ ok: true }, 201);
  } catch (e) {
    console.error("[POST /api/leads]", e);
    return jsonError(500, "Something went wrong. Please try again.");
  }
}
