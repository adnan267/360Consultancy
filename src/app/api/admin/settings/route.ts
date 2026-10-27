import { requireAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/repo";
import { bodyErrorResponse, isSameOrigin, json, jsonError, readJson } from "@/lib/security";
import { saveSiteSettings } from "@/lib/settings";
import { settingsPatchSchema } from "@/lib/validation";

export async function PATCH(req: Request) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  const session = await requireAdmin(req, "settings:manage");
  if (session instanceof Response) return session;

  let body: unknown;
  try {
    body = await readJson(req, 6_000);
  } catch (e) {
    return bodyErrorResponse(e) ?? jsonError(400, "Bad request");
  }
  const parsed = settingsPatchSchema.safeParse(body);
  if (!parsed.success || Object.keys(parsed.data).length === 0) return jsonError(422, parsed.success ? "Nothing to save" : (parsed.error.issues[0]?.message ?? "Invalid request"));

  try {
    await saveSiteSettings(parsed.data, session.email);
    await getRepo().appendAudit({ booking_id: null, actor_id: session.sub, actor_label: session.email, action: "settings_updated", from_value: null, to_value: Object.keys(parsed.data).join(","), meta: { changes: parsed.data } });
    return json({ ok: true });
  } catch (e) {
    console.error("[PATCH /api/admin/settings]", e);
    return jsonError(500, "Something went wrong");
  }
}
