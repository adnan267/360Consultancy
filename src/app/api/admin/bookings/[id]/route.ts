import { z } from "zod";
import { actorOf, requireAdmin } from "@/lib/auth";
import { applyAdminAction } from "@/lib/bookings";
import { getRepo } from "@/lib/repo";
import { bodyErrorResponse, isSameOrigin, json, jsonError, readJson } from "@/lib/security";
import { can } from "@/lib/status";
import { adminBookingActionSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const session = await requireAdmin(req, "booking:view");
  if (session instanceof Response) return session;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return jsonError(404, "Not found");
  const detail = await getRepo().getBookingDetail(id);
  if (!detail) return jsonError(404, "Not found");
  return json({ ok: true, detail });
}

export async function PATCH(req: Request, { params }: Ctx) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  // Authenticate first with the lowest permission, then authorise the specific action below.
  const session = await requireAdmin(req, "booking:view");
  if (session instanceof Response) return session;

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return jsonError(404, "Not found");

  let body: unknown;
  try {
    body = await readJson(req, 4_000);
  } catch (e) {
    return bodyErrorResponse(e) ?? jsonError(400, "Bad request");
  }
  const parsed = adminBookingActionSchema.safeParse(body);
  if (!parsed.success) return jsonError(422, "Invalid request");
  const action = parsed.data;

  const needed = action.action === "add_note" ? "booking:note" : action.action === "update_payment" ? "payment:verify" : "booking:status";
  if (!can(session.role, needed)) return jsonError(403, "You do not have permission to do this");

  try {
    const result = await applyAdminAction(id, action, actorOf(session));
    if (!result.ok) return jsonError(result.status, result.error);
    return json({ ok: true, detail: result.detail });
  } catch (e) {
    console.error("[PATCH /api/admin/bookings]", e);
    return jsonError(500, "Something went wrong");
  }
}
