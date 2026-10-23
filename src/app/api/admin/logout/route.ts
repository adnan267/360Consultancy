import { clearSessionCookie } from "@/lib/auth";
import { isSameOrigin, json, jsonError } from "@/lib/security";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  return json({ ok: true }, 200, { "Set-Cookie": clearSessionCookie() });
}
