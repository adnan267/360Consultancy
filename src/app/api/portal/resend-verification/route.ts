import { resendVerification } from "@/lib/account";
import { requireClient } from "@/lib/client-auth";
import { clientIp, isSameOrigin, json, jsonError } from "@/lib/security";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  const s = await requireClient(req);
  if (s instanceof Response) return s;
  try {
    const r = await resendVerification(s.sub, clientIp(req));
    if (!r.ok) return jsonError(r.status, r.error);
    return json({ ok: true, sent: r.sent });
  } catch (e) {
    console.error("[POST /api/portal/resend-verification]", e);
    return jsonError(500, "Something went wrong. Please try again.");
  }
}
