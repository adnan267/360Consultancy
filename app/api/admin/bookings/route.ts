import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/session";
import { getAdminDb } from "@/lib/supabase";
import { z } from "zod";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await getAdminDb().from("bookings").select("*").order("created_at", { ascending: false }).limit(200);
  if (error) return NextResponse.json({ error: "Could not load bookings." }, { status: 500 });
  return NextResponse.json({ bookings: data });
}
const updateSchema = z.object({
  id: z.string().uuid(),
  booking_status: z.enum(["new","awaiting_payment","payment_review","confirmed","completed","cancelled"]),
  payment_status: z.enum(["unpaid","proof_submitted","verified","rejected","refunded"]).optional()
});
export async function PATCH(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const origin = req.headers.get("origin");
  if (origin && origin !== process.env.NEXT_PUBLIC_SITE_URL) return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  const patch: Record<string, string> = { booking_status: parsed.data.booking_status };
  if (parsed.data.payment_status) patch.payment_status = parsed.data.payment_status;
  const { error } = await getAdminDb().from("bookings").update(patch).eq("id", parsed.data.id);
  if (error) return NextResponse.json({ error: "Could not update booking." }, { status: 500 });
  return NextResponse.json({ ok: true });
}