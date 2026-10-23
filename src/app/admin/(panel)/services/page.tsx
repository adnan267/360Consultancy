import { redirect } from "next/navigation";
import { ServiceEditor } from "@/components/AdminClient";
import { Card, Notice } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { getRepo, isDatabaseConfigured } from "@/lib/repo";
import { can } from "@/lib/status";

export default async function ServicesAdmin() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!can(session.role, "service:manage")) return <Notice tone="error">You do not have permission to manage services.</Notice>;
  if (!isDatabaseConfigured()) return <Notice tone="warn">Database not configured.</Notice>;
  const services = await getRepo().listServices();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-navy-900">Services &amp; pricing</h1>
      <Notice tone="warn">Seeded fees are <strong>proposed, not confirmed</strong>. Untick &ldquo;Needs review&rdquo; only once you have approved the fee. Do not activate a regulated service (e.g. application assistance) until its licensing requirements are confirmed. Changes to fees apply to new bookings only.</Notice>
      <div className="space-y-4">{services.map((s) => <Card key={s.id}><ServiceEditor s={s} /></Card>)}</div>
    </div>
  );
}
