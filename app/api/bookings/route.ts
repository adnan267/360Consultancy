import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminDb } from "@/lib/supabase";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(7).max(30),
  service: z.enum(["consultation", "document_review", "application_assistance"]),
  country: z.string().trim().min(2).max(80),
  message: z.string().trim().max(1000).optional().default(""),
  consent: z.literal(true),
  website: z.string().max(0).optional().default("")
});
const prices: Record<string, number> = { consultation: 1500, document_review: 3500, application_assistance: 7500 };

export async function POST(req: NextRequest) {
  if (process.env.SERVICES_ENABLED !== "true") return NextResponse.json({ error: "Bookings are not enabled yet." }, { status: 503 });
  if (!process.env.NEXT_PUBLIC_SITE_URL) return NextResponse.json({ error: "Site configuration incomplete." }, { status: 500 });
  const origin = req.headers.get("origin");
  if (origin && origin !== process.env.NEXT_PUBLIC_SITE_URL) return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Please check your details and consent." }, { status: 400 });
  if (parsed.data.website) return NextResponse.json({ ok: true }); // honeypot
  try {
    const db = getAdminDb();
    const { data, error } = await db.from("bookings").insert({
      customer_name: parsed.data.name,
      customer_email: parsed.data.email,
      customer_phone: parsed.data.phone,
      service: parsed.data.service,
      country: parsed.data.country,
      message: parsed.data.message,
      amount_pkr: prices[parsed.data.service],
      payment_method: "bank_transfer",
      payment_status: "unpaid",
      booking_status: "new"
    }).select("id,created_at,amount_pkr").single();
    if (error) throw error;
    return NextResponse.json({ ok: true, booking: data }, { status: 201 });
  } catch (e) {
    console.error("Booking insert failed", e);
    return NextResponse.json({ error: "Could not create booking. Please try again later." }, { status: 500 });
  }
}