import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { sessionSecret } from "./env";
import { can, type Permission } from "./status";
import { jsonError } from "./security";
import type { Actor, Role } from "./types";

export const SESSION_COOKIE = "admin_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours, no sliding refresh

export interface AdminSession {
  sub: string;
  email: string;
  role: Role;
}

// A real bcrypt hash of a random value; compared against when the email is
// unknown so login timing does not reveal which emails exist.
const DUMMY_HASH = "$2b$12$DJn8mk5p5kPBj27G30TXJ.vSYAGfVjmlHSDr9BkjnbQPmwtcabbOG";

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string | null): Promise<boolean> {
  return bcrypt.compare(plain, hash ?? DUMMY_HASH).then((ok) => ok && hash !== null);
}

export async function signSession(s: AdminSession): Promise<string> {
  return new SignJWT({ email: s.email, role: s.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(s.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(sessionSecret());
}

export async function verifySessionToken(token: string | undefined): Promise<AdminSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionSecret(), { algorithms: ["HS256"] });
    const role = payload.role;
    if (!payload.sub || typeof payload.email !== "string" || (role !== "admin" && role !== "staff")) return null;
    return { sub: payload.sub, email: payload.email, role };
  } catch {
    return null;
  }
}

export function serializeSessionCookie(token: string): string {
  const parts = [`${SESSION_COOKIE}=${encodeURIComponent(token)}`, "Path=/", "HttpOnly", "SameSite=Strict", `Max-Age=${SESSION_TTL_SECONDS}`];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}

export function clearSessionCookie(): string {
  const parts = [`${SESSION_COOKIE}=`, "Path=/", "HttpOnly", "SameSite=Strict", "Max-Age=0"];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}

/** For server components / pages: current session from the cookie jar, or null. */
export async function getSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value);
}

/** Parse the session cookie straight from a Request (route handlers). */
function tokenFromRequest(req: Request): string | undefined {
  const header = req.headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === SESSION_COOKIE) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

/**
 * Server-side authN + authZ for every admin API route.
 * Returns the session, or a ready-to-return 401/403 Response.
 */
export async function requireAdmin(req: Request, permission: Permission): Promise<AdminSession | Response> {
  const session = await verifySessionToken(tokenFromRequest(req));
  if (!session) return jsonError(401, "Authentication required");
  if (!can(session.role, permission)) return jsonError(403, "You do not have permission to do this");
  return session;
}

export function actorOf(s: AdminSession): Actor {
  return { id: s.sub, label: s.email, role: s.role };
}
