import { notFound, redirect } from "next/navigation";
import { Notice } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { getRepo, isDatabaseConfigured } from "@/lib/repo";
import { can } from "@/lib/status";
import { TeamRow } from "@/components/AdminClient";
import { Card } from "@/components/ui";
import { ROLE_LABEL } from "@/lib/types";

export const metadata = { title: "Team" };
export const dynamic = "force-dynamic";

export default async function TeamAdmin() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!can(session.role, "team:manage")) notFound();
  if (!isDatabaseConfigured()) return <Notice tone="warn">Database not configured.</Notice>;
  const admins = await getRepo().listAdmins();
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-extrabold text-navy-900">Team &amp; permissions</h1>
      <Notice tone="info" title="What each role can do">
        <ul className="list-disc pl-5 text-sm">
          <li><strong>{ROLE_LABEL.admin}:</strong> everything, including content, team and settings.</li>
          <li><strong>{ROLE_LABEL.consultant}:</strong> bookings, leads, cases, client documents and messages. Cannot verify payments.</li>
          <li><strong>{ROLE_LABEL.finance}:</strong> payments, reports and exports. Cannot open client documents.</li>
          <li><strong>{ROLE_LABEL.support}:</strong> bookings, leads and client messages. Cannot open documents or handle money.</li>
          <li><strong>{ROLE_LABEL.staff}:</strong> general staff (same as Consultant).</li>
        </ul>
      </Notice>
      <Card><ul className="divide-y divide-line">{admins.map((a) => <TeamRow key={a.id} a={a} isSelf={a.id === session.sub} />)}</ul></Card>
      <p className="text-xs text-muted">To add a new team member, run <code>npm run create-admin -- email role</code> (roles: admin, consultant, finance, support, staff), then adjust them here.</p>
    </div>
  );
}
