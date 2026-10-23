import Link from "next/link";
import { BookingStatusBadge, PaymentStatusBadge, pkt } from "@/components/admin";
import { Card, Notice } from "@/components/ui";
import { bankDetails, portalEnabled, servicesEnabled } from "@/lib/env";
import { getEmailProvider } from "@/lib/email";
import { formatPkr } from "@/lib/pricing";
import { getRepo, isDatabaseConfigured } from "@/lib/repo";
import { BOOKING_STATUS_LABEL, BOOKING_STATUSES } from "@/lib/types";

export default async function Dashboard() {
  if (!isDatabaseConfigured()) return <Notice tone="warn" title="Database not configured">Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to use the dashboard.</Notice>;
  const repo = getRepo();
  const [stats, recent, services, caseStats] = await Promise.all([repo.getStats(), repo.listBookings({ limit: 8, offset: 0 }), repo.listServices(), repo.getCaseStats()]);
  const warnings: string[] = [];
  if (!servicesEnabled()) warnings.push("SERVICES_ENABLED is false — public booking is closed (expected until legal prerequisites are confirmed).");
  if (!bankDetails().configured) warnings.push("Bank details are not configured — payment instructions cannot be emailed.");
  if (getEmailProvider().name === "disabled") warnings.push("No email provider configured — notifications are logged as not sent; contact customers manually.");
  if (!portalEnabled()) warnings.push("PORTAL_ENABLED is not true — the client portal (accounts, uploads, staged payments) is closed.");
  const review = services.filter((s) => s.fee_needs_review);
  if (review.length) warnings.push(`Fees still marked "needs review": ${review.map((s) => s.title).join(", ")}.`);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-extrabold text-navy-900">Dashboard</h1>
      {warnings.length > 0 && <Notice tone="warn" title="Setup items"><ul className="list-disc space-y-1 pl-5">{warnings.map((w) => <li key={w}>{w}</li>)}</ul></Notice>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[["Total bookings", stats.totalBookings], ["Last 30 days", stats.last30DaysBookings], ["Verified revenue", formatPkr(stats.verifiedRevenuePkr)], ["Pending (unverified)", formatPkr(stats.pendingRevenuePkr)]].map(([l, v]) => (
          <Card key={String(l)} className="p-5"><p className="text-sm font-semibold text-muted">{l}</p><p className="mt-1 text-2xl font-extrabold text-navy-900">{v}</p></Card>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/admin/cases?status=awaiting_intake_payment"><Card className="p-5 hover:border-gold-500"><p className="text-sm font-semibold text-muted">Case payments to verify</p><p className="mt-1 text-2xl font-extrabold text-navy-900">{caseStats.paymentsToVerify}</p></Card></Link>
        <Link href="/admin/cases?status=in_review"><Card className="p-5 hover:border-gold-500"><p className="text-sm font-semibold text-muted">Documents awaiting review</p><p className="mt-1 text-2xl font-extrabold text-navy-900">{caseStats.docsToReview}</p></Card></Link>
        <Link href="/admin/cases?status=submission_in_progress"><Card className="p-5 hover:border-gold-500"><p className="text-sm font-semibold text-muted">Files to submit</p><p className="mt-1 text-2xl font-extrabold text-navy-900">{caseStats.byStatus.submission_in_progress ?? 0}</p></Card></Link>
      </div>
      <Card>
        <h2 className="font-bold text-navy-900">By status</h2>
        <ul className="mt-3 flex flex-wrap gap-3">{BOOKING_STATUSES.map((s) => <li key={s}><Link href={`/admin/bookings?status=${s}`} className="rounded-xl border border-line px-4 py-2 text-sm hover:border-gold-500"><span className="font-extrabold text-navy-900">{stats.byStatus[s] ?? 0}</span> <span className="text-muted">{BOOKING_STATUS_LABEL[s]}</span></Link></li>)}</ul>
        <p className="mt-3 text-xs text-muted">Revenue counts only payments verified against bank records.</p>
      </Card>
      <Card className="overflow-x-auto">
        <div className="mb-3 flex items-center justify-between"><h2 className="font-bold text-navy-900">Recent bookings</h2><Link href="/admin/bookings" className="text-sm font-semibold text-navy-700 hover:underline">View all</Link></div>
        {recent.rows.length ? (
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted"><tr><th className="py-2">Reference</th><th>Name</th><th>Service</th><th>Status</th><th>Payment</th><th>Created</th></tr></thead>
            <tbody className="divide-y divide-line">{recent.rows.map((r) => (
              <tr key={r.id}><td className="py-3"><Link href={`/admin/bookings/${r.id}`} className="font-mono font-semibold text-navy-700 hover:underline">{r.reference}</Link></td><td>{r.full_name}</td><td>{r.service_title}</td><td><BookingStatusBadge status={r.status} /></td><td><PaymentStatusBadge status={r.payment_status} /></td><td className="text-muted">{pkt(r.created_at)}</td></tr>
            ))}</tbody>
          </table>
        ) : <p className="text-sm text-muted">No bookings yet.</p>}
      </Card>
    </div>
  );
}
