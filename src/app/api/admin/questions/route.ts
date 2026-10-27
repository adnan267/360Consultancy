import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/repo";
import { bodyErrorResponse, isSameOrigin, json, jsonError, readJson } from "@/lib/security";
import { wizardQuestionSchema } from "@/lib/validation";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  const s = await requireAdmin(req, "content:manage");
  if (s instanceof Response) return s;
  let body: unknown;
  try { body = await readJson(req, 8_000); } catch (e) { return bodyErrorResponse(e) ?? jsonError(400, "Bad request"); }
  const p = wizardQuestionSchema.safeParse(body);
  if (!p.success) return jsonError(422, p.error.issues[0]?.message ?? "Invalid request");
  try {
    const repo = getRepo();
    if ((await repo.listWizardQuestions()).length >= 30) return jsonError(409, "You can have at most 30 extra questions.");
    const q = await repo.saveWizardQuestion({ ...p.data, options: p.data.kind === "select" ? p.data.options : [] });
    await repo.appendAudit({ booking_id: null, actor_id: s.sub, actor_label: s.email, action: "question_created", from_value: null, to_value: q?.id ?? null, meta: {} });
    revalidatePath("/wizard");
    return json({ ok: true, question: q }, 201);
  } catch (e) {
    console.error("[POST /api/admin/questions]", e);
    return jsonError(500, "Something went wrong");
  }
}
