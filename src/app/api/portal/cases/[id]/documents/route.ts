import { z } from "zod";
import { MAX_UPLOAD_BYTES, uploadDocument } from "@/lib/cases";
import { requireClient } from "@/lib/client-auth";
import { isSameOrigin, json, jsonError } from "@/lib/security";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  const s = await requireClient(req);
  if (s instanceof Response) return s;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return jsonError(404, "Not found");
  // Reject oversized bodies before buffering them.
  if (Number(req.headers.get("content-length") ?? 0) > MAX_UPLOAD_BYTES + 100_000) return jsonError(413, "File is too large. The limit is 4 MB.");
  let form: FormData;
  try { form = await req.formData(); } catch { return jsonError(400, "Bad request"); }
  const file = form.get("file");
  if (!(file instanceof File)) return jsonError(422, "Choose a file to upload.");
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const r = await uploadDocument(s.sub, id, { docType: form.get("docType") }, { name: file.name, bytes });
    if (!r.ok) return json({ ok: false, error: r.error }, r.status);
    return json({ ok: true, documentId: r.document.id }, 201);
  } catch (e) {
    console.error("[POST /api/portal/documents]", e);
    return jsonError(500, "Upload failed. Please try again.");
  }
}
