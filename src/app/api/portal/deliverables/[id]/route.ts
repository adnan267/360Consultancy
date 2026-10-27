import { z } from "zod";
import { readDeliverable } from "@/lib/cases";
import { requireClient } from "@/lib/client-auth";
import { documentResponse } from "@/lib/document-response";
import { jsonError } from "@/lib/security";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireClient(req);
  if (s instanceof Response) return s;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return jsonError(404, "Not found");
  const r = await readDeliverable(id, s.sub);
  if (!r) return jsonError(404, "Not found");
  return documentResponse(r.file, r.bytes);
}
