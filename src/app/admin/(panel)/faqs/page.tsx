import { notFound, redirect } from "next/navigation";
import { Notice } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { getRepo, isDatabaseConfigured } from "@/lib/repo";
import { can } from "@/lib/status";
import { FaqManager } from "@/components/AdminClient";

export const metadata = { title: "FAQs" };
export const dynamic = "force-dynamic";

export default async function FaqsAdmin() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!can(session.role, "content:manage")) notFound();
  if (!isDatabaseConfigured()) return <Notice tone="warn">Database not configured.</Notice>;
  const faqs = await getRepo().listFaqs();
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-extrabold text-navy-900">FAQs</h1>
      <p className="text-sm text-muted">Edit the questions shown on the website FAQ page. Do not promise visa outcomes, timelines or fees you have not confirmed.</p>
      <FaqManager initial={faqs} />
    </div>
  );
}
