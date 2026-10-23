import { requireAdmin } from "@/lib/auth";
import { toCsv } from "@/lib/csv";
import { getRepo } from "@/lib/repo";
import { jsonError } from "@/lib/security";

export async function GET(req: Request) {
  const session = await requireAdmin(req, "export:csv");
  if (session instanceof Response) return session;
  try {
    const repo = getRepo();
    const rows: unknown[][] = [];
    for (let offset = 0; offset < 10_000; offset += 500) {
      const page = await repo.listBookings({ limit: 500, offset });
      for (const r of page.rows) rows.push([r.reference, r.created_at, r.full_name, r.email, r.service_title, r.country_name, r.preferred_at, r.fee_pkr, r.status, r.payment_status]);
      if (page.rows.length < 500) break;
    }
    await repo.appendAudit({ booking_id: null, actor_id: session.sub, actor_label: session.email, action: "csv_export", from_value: null, to_value: String(rows.length), meta: {} });
    const csv = toCsv(["reference", "created_at", "name", "email", "service", "country", "preferred_at", "fee_pkr", "status", "payment_status"], rows);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="bookings-${new Date().toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[GET /api/admin/export]", e);
    return jsonError(500, "Export failed");
  }
}
