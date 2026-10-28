import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/repo";
import { bodyErrorResponse, isSameOrigin, json, jsonError, readJson } from "@/lib/security";
import { landingPageSchema, landingSlugSchema } from "@/lib/validation";

/** Create or replace the landing page for this slug (overrides the built-in / country page). */
export async function PUT(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  const s = await requireAdmin(req, "content:manage");
  if (s instanceof Response) return s;
  const { slug } = await params;
  if (!landingSlugSchema.safeParse(slug).success) return jsonError(422, "Use lowercase letters, numbers and hyphens only in the URL slug");
  let body: unknown;
  try { body = await readJson(req, 32_000); } catch (e) { return bodyErrorResponse(e) ?? jsonError(400, "Bad request"); }
  const p = landingPageSchema.safeParse(body);
  if (!p.success) return jsonError(422, p.error.issues[0] ? `${p.error.issues[0].path.join(".") || "Field"}: ${p.error.issues[0].message}` : "Invalid request");
  try {
    const page = await getRepo().saveLandingPage({ slug, ...p.data });
    await getRepo().appendAudit({ booking_id: null, actor_id: s.sub, actor_label: s.email, action: "landing_page_saved", from_value: null, to_value: slug, meta: {} });
    revalidatePath(`/lp/${slug}`);
    return json({ ok: true, page });
  } catch (e) {
    console.error("[PUT /api/admin/landing-pages/:slug]", e);
    return jsonError(500, "Something went wrong");
  }
}

/** Remove the admin version: a built-in or country page goes back to its default, a custom page is removed. */
export async function DELETE(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  const s = await requireAdmin(req, "content:manage");
  if (s instanceof Response) return s;
  const { slug } = await params;
  if (!landingSlugSchema.safeParse(slug).success) return jsonError(404, "Not found");
  try {
    await getRepo().deleteLandingPage(slug);
    await getRepo().appendAudit({ booking_id: null, actor_id: s.sub, actor_label: s.email, action: "landing_page_reset", from_value: slug, to_value: null, meta: {} });
    revalidatePath(`/lp/${slug}`);
    return json({ ok: true });
  } catch (e) {
    console.error("[DELETE /api/admin/landing-pages/:slug]", e);
    return jsonError(500, "Something went wrong");
  }
}
