import { notFound, redirect } from "next/navigation";
import { TemplateManager } from "@/components/AdminBuilders";
import { Notice } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { TEMPLATE_DEFAULTS } from "@/lib/notifications";
import { getRepo, isDatabaseConfigured } from "@/lib/repo";
import { can } from "@/lib/status";
import { EMAIL_TEMPLATE_KEYS } from "@/lib/types";

export const metadata = { title: "Email templates" };
export const dynamic = "force-dynamic";

export default async function TemplatesAdmin() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!can(session.role, "content:manage")) notFound();
  if (!isDatabaseConfigured()) return <Notice tone="warn">Database not configured.</Notice>;
  const saved = await getRepo().listEmailTemplates();
  const templates = EMAIL_TEMPLATE_KEYS.map((key) => {
    const d = TEMPLATE_DEFAULTS[key];
    const c = saved.find((t) => t.key === key);
    return { key, label: d.label, vars: d.vars, subject: c?.subject ?? d.subject, body: c?.body ?? d.body, custom: !!c };
  });
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-extrabold text-navy-900">Email templates</h1>
      <p className="text-sm text-muted">Emails sent to clients about their case. Emails go out only when an email provider is enabled in Settings. Never promise visa outcomes here.</p>
      <TemplateManager templates={templates} />
    </div>
  );
}
