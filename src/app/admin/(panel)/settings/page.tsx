import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/AdminClient";
import { Notice } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { getEmailProvider } from "@/lib/email";
import { isDatabaseConfigured } from "@/lib/repo";
import { getSiteSettingsFresh } from "@/lib/settings";
import { can } from "@/lib/status";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!can(session.role, "settings:manage")) return <Notice tone="error">You do not have permission to change settings.</Notice>;
  if (!isDatabaseConfigured()) return <Notice tone="warn">Database not configured.</Notice>;
  const settings = await getSiteSettingsFresh();
  const providerOn = getEmailProvider().name !== "disabled";
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-extrabold text-navy-900">Settings</h1>
      {!providerOn && <Notice tone="warn">No email provider is connected yet (EMAIL_PROVIDER and RESEND_API_KEY). You can save addresses now, but no email will actually be sent until it is.</Notice>}
      <SettingsForm initial={settings} />
    </div>
  );
}
