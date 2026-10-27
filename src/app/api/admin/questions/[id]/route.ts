import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/repo";
import { bodyErrorResponse, isSameOrigin, json, jsonError, readJson } from "@/lib/security";
import { wizardQuestionPatchSchema } from "@/lib/validation";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  const s = await requireAdmin(req, "content:manage");
  if (s instanceof Response) return s;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return jsonError(404, "Not found");
  let body: unknown;
  try { body = await readJson(req, 8_000); } catch (e) { return bodyErrorResponse(e) ?? jsonError(400, "Bad request"); }
  const p = wizardQuestionPatchSchema.safeParse(body);
  if (!p.success || !Object.keys(p.data).length) return jsonError(422, "Invalid request");
  try {
    const repo = getRepo();
    const cur = (await repo.listWizardQuestions()).find((q) => q.id === id);
    if (!cur) return jsonError(404, "Not found");
    const next = { ...cur, ...p.data, id };
    if (next.kind === "select" && next.options.length < 2) return jsonError(422, "A choice question needs at least two options");
    const q = await repo.saveWizardQuestion(next);
    await repo.appendAudit({ booking_id: null, actor_id: s.sub, actor_label: s.email, action: "question_updated", from_value: null, to_value: id, meta: {} });
    revalidatePath("/wizard");
    return json({ ok: true, question: q });
  } catch (e) {
    console.error("[PATCH /api/admin/questions/:id]", e);
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
    await getRepo().deleteWizardQuestion(id);
    await getRepo().appendAudit({ booking_id: null, actor_id: s.sub, actor_label: s.email, action: "question_deleted", from_value: id, to_value: null, meta: {} });
    revalidatePath("/wizard");
    return json({ ok: true });
  } catch (e) {
    console.error("[DELETE /api/admin/questions/:id]", e);
    return jsonError(500, "Something went wrong");
  }
}
