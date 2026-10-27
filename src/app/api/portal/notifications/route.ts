import { requireClient } from "@/lib/client-auth";
import { getRepo } from "@/lib/repo";
import { isSameOrigin, json, jsonError } from "@/lib/security";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  const s = await requireClient(req);
  if (s instanceof Response) return s;
  try {
    await getRepo().markNotificationsRead(s.sub);
    return json({ ok: true });
  } catch (e) {
    console.error("[POST /api/portal/notifications]", e);
    return jsonError(500, "Something went wrong");
  }
}
