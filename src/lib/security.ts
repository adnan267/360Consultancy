import { siteUrl } from "./env";

/** Best-effort client IP behind Vercel's proxy. Used only for rate-limit keys. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  const first = fwd?.split(",")[0]?.trim();
  return first || req.headers.get("x-real-ip") || "unknown";
}

/**
 * CSRF / origin protection for state-changing requests. Browsers always send
 * Origin on cross-origin POST/PATCH; we require it to match our own host.
 */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    const o = new URL(origin);
    const allowed = new Set<string>([new URL(siteUrl()).host]);
    const host = req.headers.get("host");
    if (host && process.env.NODE_ENV !== "production") allowed.add(host); // local dev / previews
    const fwdHost = req.headers.get("x-forwarded-host");
    if (fwdHost && process.env.VERCEL_ENV === "preview") allowed.add(fwdHost);
    return allowed.has(o.host);
  } catch {
    return false;
  }
}

export function json(body: unknown, status = 200, headers?: HeadersInit): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

export function jsonError(status: number, message: string, extra?: Record<string, unknown>): Response {
  return json({ ok: false, error: message, ...extra }, status);
}

/** Read a JSON body with a hard size cap so oversized payloads are rejected cheaply. */
export async function readJson(req: Request, maxBytes = 16_000): Promise<unknown> {
  const len = Number(req.headers.get("content-length") ?? "0");
  if (len > maxBytes) throw new PayloadTooLarge();
  const text = await req.text();
  if (text.length > maxBytes) throw new PayloadTooLarge();
  try {
    return JSON.parse(text);
  } catch {
    throw new BadJson();
  }
}
export class PayloadTooLarge extends Error {}
export class BadJson extends Error {}

export function bodyErrorResponse(e: unknown): Response | null {
  if (e instanceof PayloadTooLarge) return jsonError(413, "Request too large");
  if (e instanceof BadJson) return jsonError(400, "Invalid JSON");
  return null;
}
