import { z } from "zod";
import { requireClient } from "@/lib/client-auth";
import { bodyErrorResponse, isSameOrigin, json, jsonError, readJson } from "@/lib/security";
import { createDataRequest } from "@/lib/cms";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  const s = await requireClient(req);
  if (s instanceof Response) return s;
  let body: unknown;
  try { body = await readJson(req, 2_000); } catch (e) { return bodyErrorResponse(e) ?? jsonError(400, "Bad request"); }
  try {
    const r = await createDataRequest(s.sub, body);
    if (!r.ok) return jsonError(r.status, r.error);
    return json({ ok: true });
  } catch (e) {
    console.error("[POST /api/portal/data-request]", e);
    return jsonError(500, "Something went wrong. Please try again.");
  }
}
