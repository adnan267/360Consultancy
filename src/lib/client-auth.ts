import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { sessionSecret } from "./env";
import { jsonError } from "./security";

export const CLIENT_COOKIE = "client_session";
export const CLIENT_TTL_SECONDS = 60 * 60 * 24; // 24 h, no sliding refresh
const AUD = "client"; // admin tokens carry no audience and a role claim; the two can never be swapped

export interface ClientSession {
  sub: string;
  email: string;
}

export async function signClientSession(s: ClientSession): Promise<string> {
  return new SignJWT({ email: s.email }).setProtectedHeader({ alg: "HS256" }).setSubject(s.sub).setAudience(AUD).setIssuedAt().setExpirationTime(`${CLIENT_TTL_SECONDS}s`).sign(sessionSecret());
}

export async function verifyClientToken(token: string | undefined): Promise<ClientSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionSecret(), { algorithms: ["HS256"], audience: AUD });
    if (!payload.sub || typeof payload.email !== "string" || "role" in payload) return null;
    return { sub: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

const attrs = () => ["Path=/", "HttpOnly", "SameSite=Lax", ...(process.env.NODE_ENV === "production" ? ["Secure"] : [])];
export const serializeClientCookie = (token: string) => [`${CLIENT_COOKIE}=${encodeURIComponent(token)}`, ...attrs(), `Max-Age=${CLIENT_TTL_SECONDS}`].join("; ");
export const clearClientCookie = () => [`${CLIENT_COOKIE}=`, ...attrs(), "Max-Age=0"].join("; ");

export async function getClientSession(): Promise<ClientSession | null> {
  return verifyClientToken((await cookies()).get(CLIENT_COOKIE)?.value);
}

function tokenFromRequest(req: Request): string | undefined {
  for (const part of (req.headers.get("cookie") ?? "").split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === CLIENT_COOKIE) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

export async function requireClient(req: Request): Promise<ClientSession | Response> {
  const s = await verifyClientToken(tokenFromRequest(req));
  return s ?? jsonError(401, "Please sign in");
}
