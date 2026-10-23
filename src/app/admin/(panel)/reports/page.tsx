import { notFound, redirect } from "next/navigation";
import { Card, Notice } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { formatPkr } from "@/lib/pricing";
import { getRepo, isDatabaseConfigured } from "@/lib/repo";
import { can } from "@/lib/status";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reports" };

function Table({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return rows.length ? (
    <table className="mt-3 w-full text-sm">
      <thead><tr className="text-left text-muted">{head.map((h, i) => <th key={h} className={`pb-2 font-semibold ${i ? "text-right" : ""}`}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((r) => <tr key={String(r[0])} className="border-t border-line">{r.map((c, i) => <td key={i} className={`py-2 ${i ? "text-right tabular-nums" : ""}`}>{c}</td>)}</tr>)}</tbody>
    </table>
  ) : <p className="mt-3 text-sm text-muted">No data yet.</p>;
}

export default async function ReportsPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!can(session.role, "payment:verify")) notFound(); // admin-only: contains revenue
  if (!isDatabaseConfigured()) return <Notice tone="warn">Database not configured.</Notice>;
  const r = await getRepo().getReport();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-navy-900">Reports</h1>
      <p className="text-sm text-muted">Revenue counts only payments an admin has verified against the bank record.</p>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><h2 className="font-bold text-navy-900">Verified revenue by month</h2><Table head={["Month", "Payments", "Amount"]} rows={r.verifiedByMonth.map((m) => [m.month, m.count, formatPkr(m.amountPkr)])} /></Card>
        <Card><h2 className="font-bold text-navy-900">Bookings by destination</h2><Table head={["Destination", "Bookings"]} rows={r.byCountry.map((c) => [c.name, c.count])} /></Card>
        <Card><h2 className="font-bold text-navy-900">Bookings by service</h2><Table head={["Service", "Bookings"]} rows={r.byService.map((c) => [c.title, c.count])} /></Card>
      </div>
    </div>
  );
}
