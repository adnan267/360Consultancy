import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/repo";
import { bodyErrorResponse, isSameOrigin, json, jsonError, readJson } from "@/lib/security";
import { destinationSchema, scholarshipDetailSchema, studySlugSchema, universitySchema } from "@/lib/validation";

const KINDS = ["destinations", "universities", "scholarships"] as const;
type Kind = (typeof KINDS)[number];

function refresh() {
  for (const p of ["/study-abroad", "/scholarships"]) revalidatePath(p);
  for (const p of ["/study-abroad/destinations/[slug]", "/study-abroad/universities/[slug]", "/scholarships/[slug]"]) revalidatePath(p, "page");
  for (const p of ["/study-abroad/destinations", "/study-abroad/universities", "/study-abroad/fully-funded-scholarships", "/study-abroad/tuition-free-universities"]) revalidatePath(p);
}

/** Create or update a study-abroad record (destination, university or scholarship). */
export async function PUT(req: Request, { params }: { params: Promise<{ kind: string; slug: string }> }) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  const s = await requireAdmin(req, "content:manage");
  if (s instanceof Response) return s;
  const { kind, slug } = await params;
  if (!KINDS.includes(kind as Kind) || !studySlugSchema.safeParse(slug).success) return jsonError(404, "Not found");
  let body: unknown;
  try { body = await readJson(req, 64_000); } catch (e) { return bodyErrorResponse(e) ?? jsonError(400, "Bad request"); }
  const schema = kind === "destinations" ? destinationSchema : kind === "universities" ? universitySchema : scholarshipDetailSchema;
  const p = schema.safeParse(body);
  if (!p.success) return jsonError(422, p.error.issues[0] ? `${p.error.issues[0].path.join(".") || "Field"}: ${p.error.issues[0].message}` : "Invalid request");
  try {
    const repo = getRepo();
    if (kind === "destinations") await repo.saveStudyDestination({ slug, ...(p.data as ReturnType<typeof destinationSchema.parse>) });
    else if (kind === "universities") await repo.saveUniversity({ slug, ...(p.data as ReturnType<typeof universitySchema.parse>) });
    else await repo.saveScholarship({ slug, ...(p.data as ReturnType<typeof scholarshipDetailSchema.parse>) });
    await repo.appendAudit({ booking_id: null, actor_id: s.sub, actor_label: s.email, action: `study_${kind}_saved`, from_value: null, to_value: slug, meta: {} });
    refresh();
    return json({ ok: true });
  } catch (e) {
    console.error("[PUT /api/admin/study]", e);
    return jsonError(500, "Something went wrong");
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ kind: string; slug: string }> }) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  const s = await requireAdmin(req, "content:manage");
  if (s instanceof Response) return s;
  const { kind, slug } = await params;
  if (!KINDS.includes(kind as Kind) || !studySlugSchema.safeParse(slug).success) return jsonError(404, "Not found");
  try {
    const repo = getRepo();
    if (kind === "destinations") await repo.deleteStudyDestination(slug);
    else if (kind === "universities") await repo.deleteUniversity(slug);
    else await repo.deleteScholarship(slug);
    await repo.appendAudit({ booking_id: null, actor_id: s.sub, actor_label: s.email, action: `study_${kind}_deleted`, from_value: slug, to_value: null, meta: {} });
    refresh();
    return json({ ok: true });
  } catch (e) {
    console.error("[DELETE /api/admin/study]", e);
    return jsonError(500, "Something went wrong");
  }
}
