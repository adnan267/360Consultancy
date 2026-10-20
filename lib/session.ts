import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const cookieName = "360_admin_session";
function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters.");
  return new TextEncoder().encode(value);
}
export async function createAdminSession(email: string) {
  const token = await new SignJWT({ role: "admin", email })
    .setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("8h").sign(secret());
  const jar = await cookies();
  jar.set(cookieName, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 8 * 60 * 60 });
}
export async function isAdmin() {
  try {
    const jar = await cookies();
    const token = jar.get(cookieName)?.value;
    if (!token) return false;
    const { payload } = await jwtVerify(token, secret());
    return payload.role === "admin" && payload.email === process.env.ADMIN_EMAIL;
  } catch { return false; }
}
export async function clearAdminSession() {
  const jar = await cookies();
  jar.set(cookieName, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
}
export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}