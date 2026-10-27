import { z } from "zod";
import { actorOf, requireAdmin } from "@/lib/auth";
import { deleteDeliverable, readDeliverable } from "@/lib/cases";
import { documentResponse } from "@/lib/document-response";
import { isSameOrigin, json, jsonError } from "@/lib/security";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireAdmin(req, "document:view");
  if (s instanceof Response) return s;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return jsonError(404, "Not found");
  const r = await readDeliverable(id, "staff");
  if (!r) return jsonError(404, "Not found");
  return documentResponse(r.file, r.bytes);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  const s = await requireAdmin(req, "document:view");
  if (s instanceof Response) return s;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return jsonError(404, "Not found");
  const r = await deleteDeliverable(actorOf(s), id);
  if (!r.ok) return json({ ok: false, error: r.error }, r.status);
  return json({ ok: true });
}
