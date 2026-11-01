import { cookies } from "next/headers";
import { CHAT_COOKIE, startChat, visitorPoll, visitorSend } from "@/lib/chat";
import { bodyErrorResponse, clientIp, isSameOrigin, json, jsonError, readJson } from "@/lib/security";

const cookieOpts = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 7 };

export async function GET() {
  try {
    const token = (await cookies()).get(CHAT_COOKIE)?.value;
    if (!token) return json({ ok: true, messages: [], closed: false, started: false });
    const r = await visitorPoll(token);
    if (!r.ok) return json({ ok: true, messages: [], closed: false, started: false });
    return json({ ok: true, messages: r.messages, closed: r.closed, started: true });
  } catch (e) {
    console.error("[GET /api/chat]", e);
    return jsonError(500, "Something went wrong");
  }
}

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError(403, "Forbidden");
  let input: Record<string, unknown>;
  try {
    input = (await readJson(req, 4_000)) as Record<string, unknown>;
  } catch (e) {
    return bodyErrorResponse(e) ?? jsonError(400, "Bad request");
  }
  try {
    const jar = await cookies();
    const ip = clientIp(req);
    const { action, ...rest } = input ?? {};
    if (action === "start") {
      const r = await startChat(rest, { ip });
      if (!r.ok) return json({ ok: false, error: r.error, fields: r.fields }, r.status);
      jar.set(CHAT_COOKIE, r.token, cookieOpts);
      return json({ ok: true, messages: r.messages }, 201);
    }
    if (action === "send") {
      const r = await visitorSend(jar.get(CHAT_COOKIE)?.value, rest, { ip });
      if (!r.ok) return json({ ok: false, error: r.error }, r.status);
      return json({ ok: true, messages: r.messages });
    }
    return jsonError(422, "Invalid request");
  } catch (e) {
    console.error("[POST /api/chat]", e);
    return jsonError(500, "Something went wrong. Please try again.");
  }
}
