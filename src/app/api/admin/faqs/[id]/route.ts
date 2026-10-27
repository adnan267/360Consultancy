import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actorOf, requireAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/repo";
import { bodyErrorResponse, isSameOrigin, json, jsonError, readJson } from "@/lib/security";
import { faqPatchSchema } from "@/lib/validation";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  const s = await requireAdmin(req, "content:manage");
  if (s instanceof Response) return s;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return jsonError(404, "Not found");
  let body: unknown;
  try { body = await readJson(req, 8_000); } catch (e) { return bodyErrorResponse(e) ?? jsonError(400, "Bad request"); }
  const p = faqPatchSchema.safeParse(body);
  if (!p.success || !Object.keys(p.data).length) return jsonError(422, "Invalid request");
  try {
    const cur = (await getRepo().listFaqs()).find((f) => f.id === id);
    if (!cur) return jsonError(404, "Not found");
    const f = await getRepo().saveFaq({ ...cur, ...p.data, id });
    await getRepo().appendAudit({ booking_id: null, actor_id: s.sub, actor_label: s.email, action: "faq_updated", from_value: null, to_value: id, meta: {} });
    revalidatePath("/faq");
    return json({ ok: true, faq: f });
  } catch (e) {
    console.error("[PATCH /api/admin/faqs/:id]", e);
    return jsonError(500, "Something went wrong");
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  const s = await requireAdmin(req, "content:manage");
  if (s instanceof Response) return s;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return jsonError(404, "Not found");
  try {
    await getRepo().deleteFaq(id);
    await getRepo().appendAudit({ booking_id: null, actor_id: s.sub, actor_label: s.email, action: "faq_deleted", from_value: id, to_value: null, meta: {} });
    revalidatePath("/faq");
    return json({ ok: true });
  } catch (e) {
    console.error("[DELETE /api/admin/faqs/:id]", e);
    return jsonError(500, "Something went wrong");
  }
}
