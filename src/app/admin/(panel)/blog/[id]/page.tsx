import { notFound, redirect } from "next/navigation";
import { Notice } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { getRepo, isDatabaseConfigured } from "@/lib/repo";
import { can } from "@/lib/status";
import { z } from "zod";
import { BlogEditor } from "@/components/AdminClient";

export const metadata = { title: "Edit post" };
export const dynamic = "force-dynamic";

export default async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!can(session.role, "content:manage")) notFound();
  if (!isDatabaseConfigured()) return <Notice tone="warn">Database not configured.</Notice>;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const post = await getRepo().getBlogPost({ id });
  if (!post) notFound();
  return (<div className="space-y-6"><h1 className="text-2xl font-extrabold text-navy-900">Edit post</h1><BlogEditor post={post} /></div>);
}
