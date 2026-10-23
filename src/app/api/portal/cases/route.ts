import { createCase } from "@/lib/cases";
import { requireClient } from "@/lib/client-auth";
import { bodyErrorResponse, isSameOrigin, json, jsonError, readJson } from "@/lib/security";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  const s = await requireClient(req);
  if (s instanceof Response) return s;
  let body: unknown;
  try { body = await readJson(req, 1_000); } catch (e) { return bodyErrorResponse(e) ?? jsonError(400, "Bad request"); }
  try {
    const r = await createCase(s.sub, body);
    if (!r.ok) return json({ ok: false, error: r.error, fields: r.fields }, r.status);
    return json({ ok: true, caseId: r.caseId, reference: r.reference }, 201);
  } catch (e) {
    console.error("[POST /api/portal/cases]", e);
    return jsonError(500, "Something went wrong. Please try again.");
  }
}
