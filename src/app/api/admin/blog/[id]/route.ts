import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actorOf, requireAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/repo";
import { bodyErrorResponse, isSameOrigin, json, jsonError, readJson } from "@/lib/security";
import { DuplicateReferenceError } from "@/lib/repo/types";
import { blogPatchSchema } from "@/lib/validation";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  const s = await requireAdmin(req, "content:manage");
  if (s instanceof Response) return s;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return jsonError(404, "Not found");
  let body: unknown;
  try { body = await readJson(req, 80_000); } catch (e) { return bodyErrorResponse(e) ?? jsonError(400, "Bad request"); }
  const p = blogPatchSchema.safeParse(body);
  if (!p.success || !Object.keys(p.data).length) return jsonError(422, p.success ? "Nothing to save" : (p.error.issues[0]?.message ?? "Invalid request"));
  try {
    const cur = await getRepo().getBlogPost({ id });
    if (!cur) return jsonError(404, "Not found");
    const post = await getRepo().saveBlogPost({
      id, slug: p.data.slug ?? cur.slug, title: p.data.title ?? cur.title, excerpt: p.data.excerpt ?? cur.excerpt, body: p.data.body ?? cur.body,
      meta_title: p.data.meta_title === undefined ? cur.meta_title : p.data.meta_title, meta_description: p.data.meta_description === undefined ? cur.meta_description : p.data.meta_description,
      is_published: p.data.is_published ?? cur.is_published,
    });
    await getRepo().appendAudit({ booking_id: null, actor_id: s.sub, actor_label: s.email, action: "blog_updated", from_value: null, to_value: post.slug, meta: {} });
    revalidatePath("/blog"); revalidatePath(`/blog/${cur.slug}`); revalidatePath(`/blog/${post.slug}`); revalidatePath("/sitemap.xml");
    return json({ ok: true });
  } catch (e) {
    if (e instanceof DuplicateReferenceError) return jsonError(409, "That URL slug is already used by another post");
    console.error("[PATCH /api/admin/blog/:id]", e);
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
    const cur = await getRepo().getBlogPost({ id });
    await getRepo().deleteBlogPost(id);
    await getRepo().appendAudit({ booking_id: null, actor_id: s.sub, actor_label: s.email, action: "blog_deleted", from_value: cur?.slug ?? id, to_value: null, meta: {} });
    revalidatePath("/blog"); revalidatePath("/sitemap.xml");
    return json({ ok: true });
  } catch (e) {
    console.error("[DELETE /api/admin/blog/:id]", e);
    return jsonError(500, "Something went wrong");
  }
}
