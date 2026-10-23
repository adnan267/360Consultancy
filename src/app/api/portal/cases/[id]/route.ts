import { z } from "zod";
import { clientCaseAction } from "@/lib/cases";
import { requireClient } from "@/lib/client-auth";
import { bodyErrorResponse, isSameOrigin, json, jsonError, readJson } from "@/lib/security";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  const s = await requireClient(req);
  if (s instanceof Response) return s;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return jsonError(404, "Not found");
  let body: unknown;
  try { body = await readJson(req, 1_000); } catch (e) { return bodyErrorResponse(e) ?? jsonError(400, "Bad request"); }
  try {
    const r = await clientCaseAction(s.sub, id, body);
    if (!r.ok) return json({ ok: false, error: r.error }, r.status);
    return json({ ok: true });
  } catch (e) {
    console.error("[POST /api/portal/cases/:id]", e);
    return jsonError(500, "Something went wrong. Please try again.");
  }
}
