import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { readDocument } from "@/lib/cases";
import { documentResponse } from "@/lib/document-response";
import { getRepo } from "@/lib/repo";
import { jsonError } from "@/lib/security";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireAdmin(req, "case:view");
  if (s instanceof Response) return s;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return jsonError(404, "Not found");
  const r = await readDocument(id, "staff");
  if (!r) return jsonError(404, "Not found");
  await getRepo().appendAudit({ booking_id: null, case_id: r.doc.case_id, actor_id: s.sub, actor_label: s.email, action: "document_downloaded", from_value: null, to_value: r.doc.doc_type, meta: { documentId: r.doc.id } });
  return documentResponse(r.doc, r.bytes);
}
