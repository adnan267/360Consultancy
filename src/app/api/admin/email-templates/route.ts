import { requireAdmin } from "@/lib/auth";
import { TEMPLATE_DEFAULTS } from "@/lib/notifications";
import { getRepo } from "@/lib/repo";
import { bodyErrorResponse, isSameOrigin, json, jsonError, readJson } from "@/lib/security";
import { emailTemplateSchema } from "@/lib/validation";

export async function PUT(req: Request) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  const s = await requireAdmin(req, "content:manage");
  if (s instanceof Response) return s;
  let body: unknown;
  try { body = await readJson(req, 8_000); } catch (e) { return bodyErrorResponse(e) ?? jsonError(400, "Bad request"); }
  const p = emailTemplateSchema.safeParse(body);
  if (!p.success) return jsonError(422, p.error.issues[0]?.message ?? "Invalid request");
  const allowed = TEMPLATE_DEFAULTS[p.data.key].vars;
  const bad = [...(p.data.subject + p.data.body).matchAll(/\{\{\s*([a-z_]+)\s*\}\}/g)].map((m) => m[1]).find((v) => !allowed.includes(v));
  if (bad) return jsonError(422, `Unknown placeholder {{${bad}}}. Allowed: ${allowed.map((v) => `{{${v}}}`).join(", ")}`);
  try {
    const repo = getRepo();
    await repo.saveEmailTemplate(p.data.key, p.data.subject, p.data.body);
    await repo.appendAudit({ booking_id: null, actor_id: s.sub, actor_label: s.email, action: "email_template_updated", from_value: null, to_value: p.data.key, meta: {} });
    return json({ ok: true });
  } catch (e) {
    console.error("[PUT /api/admin/email-templates]", e);
    return jsonError(500, "Something went wrong");
  }
}
