import Link from "next/link";
import { BookingStatusBadge, PaymentStatusBadge, pkt } from "@/components/admin";
import { Button, Card, Notice } from "@/components/ui";
import { formatPkr } from "@/lib/pricing";
import { getRepo, isDatabaseConfigured } from "@/lib/repo";
import { BOOKING_STATUS_LABEL, BOOKING_STATUSES, PAYMENT_STATUS_LABEL, PAYMENT_STATUSES } from "@/lib/types";
import type { z } from "zod";
import { bookingFilterSchema } from "@/lib/validation";

const PAGE = 25;
const input = "rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm";

export default async function Bookings({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!isDatabaseConfigured()) return <Notice tone="warn">Database not configured.</Notice>;
  const raw = await searchParams;
  const f = bookingFilterSchema.safeParse({ q: raw.q || undefined, status: raw.status || undefined, paymentStatus: raw.paymentStatus || undefined, page: raw.page || 1 });
  const filter: z.infer<typeof bookingFilterSchema> = f.success ? f.data : { page: 1 };
  const { rows, total } = await getRepo().listBookings({ q: filter.q, status: filter.status, paymentStatus: filter.paymentStatus, limit: PAGE, offset: (filter.page - 1) * PAGE });
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const qs = (p: number) => { const u = new URLSearchParams(); if (filter.q) u.set("q", filter.q); if (filter.status) u.set("status", filter.status); if (filter.paymentStatus) u.set("paymentStatus", filter.paymentStatus); u.set("page", String(p)); return `?${u}`; };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-navy-900">Bookings</h1>
      <form method="get" className="flex flex-wrap items-end gap-3">
        <div><label className="mb-1 block text-xs font-semibold" htmlFor="q">Search</label><input id="q" name="q" defaultValue={filter.q} placeholder="Reference, name or email" className={`${input} w-64`} /></div>
        <div><label className="mb-1 block text-xs font-semibold" htmlFor="status">Status</label><select id="status" name="status" defaultValue={filter.status ?? ""} className={input}><option value="">All</option>{BOOKING_STATUSES.map((s) => <option key={s} value={s}>{BOOKING_STATUS_LABEL[s]}</option>)}</select></div>
        <div><label className="mb-1 block text-xs font-semibold" htmlFor="ps">Payment</label><select id="ps" name="paymentStatus" defaultValue={filter.paymentStatus ?? ""} className={input}><option value="">All</option>{PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{PAYMENT_STATUS_LABEL[s]}</option>)}</select></div>
        <Button type="submit" variant="dark">Filter</Button>
        <Link href="/admin/bookings" className="py-3 text-sm font-semibold text-navy-700 hover:underline">Reset</Link>
      </form>
      <Card className="overflow-x-auto">
        {rows.length ? (
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted"><tr><th className="py-2">Reference</th><th>Customer</th><th>Service / country</th><th>Fee</th><th>Status</th><th>Payment</th><th>Preferred (PKT)</th></tr></thead>
            <tbody className="divide-y divide-line">{rows.map((r) => (
              <tr key={r.id}><td className="py-3"><Link href={`/admin/bookings/${r.id}`} className="font-mono font-semibold text-navy-700 hover:underline">{r.reference}</Link></td><td>{r.full_name}<br /><span className="text-xs text-muted">{r.email}</span></td><td>{r.service_title}<br /><span className="text-xs text-muted">{r.country_name}</span></td><td>{formatPkr(r.fee_pkr)}</td><td><BookingStatusBadge status={r.status} /></td><td><PaymentStatusBadge status={r.payment_status} /></td><td className="text-muted">{pkt(r.preferred_at)}</td></tr>
            ))}</tbody>
          </table>
        ) : <p className="py-6 text-center text-sm text-muted">No bookings match.</p>}
      </Card>
      <div className="flex items-center justify-between text-sm text-muted"><span>{total} booking{total === 1 ? "" : "s"}</span><div className="flex gap-3">{filter.page > 1 && <Link className="font-semibold text-navy-700" href={qs(filter.page - 1)}>← Previous</Link>}<span>Page {filter.page} of {pages}</span>{filter.page < pages && <Link className="font-semibold text-navy-700" href={qs(filter.page + 1)}>Next →</Link>}</div></div>
    </div>
  );
}
