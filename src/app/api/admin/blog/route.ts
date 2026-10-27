import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actorOf, requireAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/repo";
import { bodyErrorResponse, isSameOrigin, json, jsonError, readJson } from "@/lib/security";
import { DuplicateReferenceError } from "@/lib/repo/types";
import { blogSchema } from "@/lib/validation";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  const s = await requireAdmin(req, "content:manage");
  if (s instanceof Response) return s;
  let body: unknown;
  try { body = await readJson(req, 80_000); } catch (e) { return bodyErrorResponse(e) ?? jsonError(400, "Bad request"); }
  const p = blogSchema.safeParse(body);
  if (!p.success) return jsonError(422, p.error.issues[0]?.message ?? "Invalid request");
  try {
    const post = await getRepo().saveBlogPost({ ...p.data, meta_title: p.data.meta_title ?? null, meta_description: p.data.meta_description ?? null });
    await getRepo().appendAudit({ booking_id: null, actor_id: s.sub, actor_label: s.email, action: "blog_created", from_value: null, to_value: post.slug, meta: {} });
    revalidatePath("/blog"); revalidatePath("/sitemap.xml");
    return json({ ok: true, id: post.id }, 201);
  } catch (e) {
    if (e instanceof DuplicateReferenceError) return jsonError(409, "That URL slug is already used by another post");
    console.error("[POST /api/admin/blog]", e);
    return jsonError(500, "Something went wrong");
  }
}
