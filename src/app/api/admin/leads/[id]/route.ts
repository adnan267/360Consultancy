import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/repo";
import { bodyErrorResponse, isSameOrigin, json, jsonError, readJson } from "@/lib/security";
import { LEAD_STATUSES } from "@/lib/types";

const schema = z.strictObject({ status: z.enum(LEAD_STATUSES) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  const session = await requireAdmin(req, "lead:manage");
  if (session instanceof Response) return session;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return jsonError(404, "Not found");
  let body: unknown;
  try {
    body = await readJson(req, 1_000);
  } catch (e) {
    return bodyErrorResponse(e) ?? jsonError(400, "Bad request");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError(422, "Invalid request");
  try {
    const repo = getRepo();
    const lead = await repo.setLeadStatus(id, parsed.data.status);
    if (!lead) return jsonError(404, "Not found");
    await repo.appendAudit({ booking_id: null, actor_id: session.sub, actor_label: session.email, action: "lead_status_changed", from_value: null, to_value: parsed.data.status, meta: { leadId: id } });
    return json({ ok: true, lead });
  } catch (e) {
    console.error("[PATCH /api/admin/leads]", e);
    return jsonError(500, "Something went wrong");
  }
}
