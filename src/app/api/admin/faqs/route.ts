import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actorOf, requireAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/repo";
import { bodyErrorResponse, isSameOrigin, json, jsonError, readJson } from "@/lib/security";
import { seedDefaultFaqs } from "@/lib/cms";
import { faqSchema } from "@/lib/validation";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  const s = await requireAdmin(req, "content:manage");
  if (s instanceof Response) return s;
  let body: unknown;
  try { body = await readJson(req, 8_000); } catch (e) { return bodyErrorResponse(e) ?? jsonError(400, "Bad request"); }
  try {
    if ((body as { seedDefaults?: boolean } | null)?.seedDefaults === true) {
      const n = await seedDefaultFaqs();
      revalidatePath("/faq");
      return json({ ok: true, imported: n });
    }
    const p = faqSchema.safeParse(body);
    if (!p.success) return jsonError(422, p.error.issues[0]?.message ?? "Invalid request");
    const f = await getRepo().saveFaq(p.data);
    await getRepo().appendAudit({ booking_id: null, actor_id: s.sub, actor_label: s.email, action: "faq_created", from_value: null, to_value: f?.id ?? null, meta: {} });
    revalidatePath("/faq");
    return json({ ok: true, faq: f }, 201);
  } catch (e) {
    console.error("[POST /api/admin/faqs]", e);
    return jsonError(500, "Something went wrong");
  }
}
