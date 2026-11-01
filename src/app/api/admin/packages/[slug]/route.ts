import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/repo";
import { bodyErrorResponse, isSameOrigin, json, jsonError, readJson } from "@/lib/security";
import { packageSchema, packageSlugSchema } from "@/lib/validation";

function refresh() {
  for (const p of ["/tour-packages", "/religious-tours"]) revalidatePath(p);
  revalidatePath("/religious-tours/[section]", "page");
}

/** Create or update a package. The price is only shown publicly when `show_price` is on. */
export async function PUT(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  const s = await requireAdmin(req, "service:manage");
  if (s instanceof Response) return s;
  const { slug } = await params;
  if (!packageSlugSchema.safeParse(slug).success) return jsonError(422, "Use 3 or more lowercase letters, numbers and hyphens in the URL name");
  let body: unknown;
  try { body = await readJson(req, 16_000); } catch (e) { return bodyErrorResponse(e) ?? jsonError(400, "Bad request"); }
  const p = packageSchema.safeParse(body);
  if (!p.success) return jsonError(422, p.error.issues[0] ? `${p.error.issues[0].path.join(".") || "Field"}: ${p.error.issues[0].message}` : "Invalid request");
  try {
    const row = await getRepo().saveTourPackage({ slug, ...p.data });
    await getRepo().appendAudit({ booking_id: null, actor_id: s.sub, actor_label: s.email, action: "package_saved", from_value: null, to_value: slug, meta: { show_price: p.data.show_price, price_pkr: p.data.price_pkr } });
    refresh();
    return json({ ok: true, package: row });
  } catch (e) {
    console.error("[PUT /api/admin/packages]", e);
    return jsonError(500, "Something went wrong");
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  const s = await requireAdmin(req, "service:manage");
  if (s instanceof Response) return s;
  const { slug } = await params;
  if (!packageSlugSchema.safeParse(slug).success) return jsonError(404, "Not found");
  try {
    await getRepo().deleteTourPackage(slug);
    await getRepo().appendAudit({ booking_id: null, actor_id: s.sub, actor_label: s.email, action: "package_deleted", from_value: slug, to_value: null, meta: {} });
    refresh();
    return json({ ok: true });
  } catch (e) {
    console.error("[DELETE /api/admin/packages]", e);
    return jsonError(500, "Something went wrong");
  }
}
