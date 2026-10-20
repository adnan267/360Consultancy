import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminSession } from "@/lib/session";

function safeEqual(a: string, b: string) {
  const aa = Buffer.from(a); const bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const expectedOrigin = process.env.NEXT_PUBLIC_SITE_URL;
  if (origin && expectedOrigin && origin !== expectedOrigin) return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  let body: { email?: string; password?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const email = process.env.ADMIN_EMAIL || "";
  const password = process.env.ADMIN_PASSWORD || "";
  if (!email || !password || !process.env.SESSION_SECRET || !safeEqual(body.email || "", email) || !safeEqual(body.password || "", password)) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }
  await createAdminSession(email);
  return NextResponse.json({ ok: true });
}