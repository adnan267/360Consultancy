import { z } from "zod";
import { deleteClientDocument, readDocument } from "@/lib/cases";
import { requireClient } from "@/lib/client-auth";
import { documentResponse } from "@/lib/document-response";
import { isSameOrigin, json, jsonError } from "@/lib/security";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireClient(req);
  if (s instanceof Response) return s;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return jsonError(404, "Not found");
  const r = await readDocument(id, s.sub);
  return r ? documentResponse(r.doc, r.bytes) : jsonError(404, "Not found");
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  const s = await requireClient(req);
  if (s instanceof Response) return s;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return jsonError(404, "Not found");
  try {
    const r = await deleteClientDocument(s.sub, id);
    return r.ok ? json({ ok: true }) : json({ ok: false, error: r.error }, r.status);
  } catch (e) {
    console.error("[DELETE /api/portal/documents]", e);
    return jsonError(500, "Something went wrong.");
  }
}
