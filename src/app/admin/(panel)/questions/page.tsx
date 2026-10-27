import { notFound, redirect } from "next/navigation";
import { AdminQuestionsView } from "./view";
import { getSession } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/repo";
import { can } from "@/lib/status";
import { Notice } from "@/components/ui";

export const metadata = { title: "Wizard questions" };
export const dynamic = "force-dynamic";

export default async function QuestionsAdmin() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!can(session.role, "content:manage")) notFound();
  if (!isDatabaseConfigured()) return <Notice tone="warn">Database not configured.</Notice>;
  return <AdminQuestionsView />;
}
