import { notFound, redirect } from "next/navigation";
import { Notice } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { getRepo, isDatabaseConfigured } from "@/lib/repo";
import { can } from "@/lib/status";
import { pkt } from "@/components/admin";
import { DataRequestActions } from "@/components/AdminClient";
import { Badge, Card } from "@/components/ui";

export const metadata = { title: "Data requests" };
export const dynamic = "force-dynamic";

export default async function DataRequestsAdmin() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!can(session.role, "team:manage")) notFound();
  if (!isDatabaseConfigured()) return <Notice tone="warn">Database not configured.</Notice>;
  const rows = await getRepo().listDataRequests();
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-extrabold text-navy-900">Data requests</h1>
      <Notice tone="info">Clients can ask for a copy of their data or for account deletion. Handle each request manually (export from the database / delete the records you are allowed to delete), then mark it done. Keep records that the law requires you to keep.</Notice>
      <Card>{rows.length === 0 ? <p className="text-sm text-muted">No requests.</p> : (
        <ul className="divide-y divide-line">{rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
            <span><span className="font-semibold capitalize">{r.kind}</span> · {r.client_email} <span className="text-muted">· {pkt(r.created_at)}</span></span>
            {r.status === "open" ? <DataRequestActions id={r.id} /> : <Badge tone={r.status === "done" ? "green" : "gray"}>{r.status}</Badge>}
          </li>
        ))}</ul>
      )}</Card>
    </div>
  );
}
