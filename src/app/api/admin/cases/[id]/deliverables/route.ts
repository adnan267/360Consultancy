import { z } from "zod";
import { actorOf, requireAdmin } from "@/lib/auth";
import { MAX_UPLOAD_BYTES, uploadDeliverable } from "@/lib/cases";
import { isSameOrigin, json, jsonError } from "@/lib/security";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  const s = await requireAdmin(req, "document:view");
  if (s instanceof Response) return s;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return jsonError(404, "Not found");
  if (Number(req.headers.get("content-length") ?? 0) > MAX_UPLOAD_BYTES + 100_000) return jsonError(413, "File is too large. The limit is 4 MB.");
  let form: FormData;
  try { form = await req.formData(); } catch { return jsonError(400, "Bad request"); }
  const file = form.get("file");
  if (!(file instanceof File)) return jsonError(422, "Choose a file to upload.");
  try {
    const r = await uploadDeliverable(actorOf(s), id, { name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) });
    if (!r.ok) return json({ ok: false, error: r.error }, r.status);
    return json({ ok: true, deliverableId: r.deliverable.id }, 201);
  } catch (e) {
    console.error("[POST /api/admin/cases/:id/deliverables]", e);
    return jsonError(500, "Upload failed. Please try again.");
  }
}
