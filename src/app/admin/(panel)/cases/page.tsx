import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { z } from "zod";
import { pkt } from "@/components/admin";
import { Badge, Card, Notice } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { getRepo, isDatabaseConfigured } from "@/lib/repo";
import { can } from "@/lib/status";
import { CASE_STATUSES, CASE_STATUS_LABEL } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cases" };

const filter = z.object({ status: z.enum(CASE_STATUSES).optional().catch(undefined), q: z.string().trim().max(60).optional().catch(undefined), page: z.coerce.number().int().min(1).max(500).optional().catch(1) });

export default async function CasesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!can(session.role, "case:view")) notFound();
  if (!isDatabaseConfigured()) return <Notice tone="warn">Database not configured.</Notice>;
  const raw = await searchParams;
  const f = filter.parse({ status: Array.isArray(raw.status) ? raw.status[0] : raw.status, q: Array.isArray(raw.q) ? raw.q[0] : raw.q, page: Array.isArray(raw.page) ? raw.page[0] : raw.page });
  const limit = 25;
  const page = f.page ?? 1;
  const { rows, total } = await getRepo().listCases({ status: f.status, q: f.q, limit, offset: (page - 1) * limit });
  const link = (p: number) => `/admin/cases?${new URLSearchParams({ ...(f.status ? { status: f.status } : {}), ...(f.q ? { q: f.q } : {}), page: String(p) })}`;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-navy-900">Cases</h1>
      <form className="flex flex-wrap gap-3" method="get">
        <input name="q" defaultValue={f.q} placeholder="Case reference" className="rounded-lg border border-navy-200 px-3 py-2 text-sm" />
        <select name="status" defaultValue={f.status ?? ""} className="rounded-lg border border-navy-200 px-3 py-2 text-sm"><option value="">All statuses</option>{CASE_STATUSES.map((s) => <option key={s} value={s}>{CASE_STATUS_LABEL[s]}</option>)}</select>
        <button className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white">Filter</button>
      </form>
      <Card className="overflow-x-auto">
        {rows.length ? (
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted"><tr><th className="py-2">Reference</th><th>Client</th><th>Destination</th><th>Purpose</th><th>Status</th><th>Opened</th></tr></thead>
            <tbody className="divide-y divide-line">{rows.map((r) => (
              <tr key={r.id}><td className="py-3"><Link href={`/admin/cases/${r.id}`} className="font-mono font-semibold text-navy-700 hover:underline">{r.reference}</Link></td><td>{r.client_name}<br /><span className="text-xs text-muted">{r.client_email}</span></td><td>{r.country_name}</td><td className="capitalize">{r.purpose}</td><td><Badge tone={r.status === "submitted" || r.status === "completed" ? "green" : r.status === "cancelled" ? "gray" : "navy"}>{CASE_STATUS_LABEL[r.status]}</Badge></td><td className="text-muted">{pkt(r.created_at)}</td></tr>
            ))}</tbody>
          </table>
        ) : <p className="text-sm text-muted">No cases match.</p>}
      </Card>
      <div className="flex items-center justify-between text-sm text-muted"><span>{total} case{total === 1 ? "" : "s"}</span><span className="flex gap-4">{page > 1 && <Link href={link(page - 1)} className="font-semibold text-navy-700">← Previous</Link>}{page * limit < total && <Link href={link(page + 1)} className="font-semibold text-navy-700">Next →</Link>}</span></div>
    </div>
  );
}
