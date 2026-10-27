import { notFound, redirect } from "next/navigation";
import { Notice } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { getRepo, isDatabaseConfigured } from "@/lib/repo";
import { can } from "@/lib/status";
import { BlogEditor } from "@/components/AdminClient";

export const metadata = { title: "New post" };

export default async function NewPost() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!can(session.role, "content:manage")) notFound();
  if (!isDatabaseConfigured()) return <Notice tone="warn">Database not configured.</Notice>;
  return (<div className="space-y-6"><h1 className="text-2xl font-extrabold text-navy-900">New post</h1><BlogEditor /></div>);
}
