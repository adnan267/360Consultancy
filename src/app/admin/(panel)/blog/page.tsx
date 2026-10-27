import { notFound, redirect } from "next/navigation";
import { Notice } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { getRepo, isDatabaseConfigured } from "@/lib/repo";
import { can } from "@/lib/status";
import Link from "next/link";
import { pkt } from "@/components/admin";
import { Badge, ButtonLink, Card } from "@/components/ui";

export const metadata = { title: "Blog" };
export const dynamic = "force-dynamic";

export default async function BlogAdmin() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!can(session.role, "content:manage")) notFound();
  if (!isDatabaseConfigured()) return <Notice tone="warn">Database not configured.</Notice>;
  const posts = await getRepo().listBlogPosts();
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-extrabold text-navy-900">Blog</h1><ButtonLink href="/admin/blog/new">New post</ButtonLink></div>
      {posts.length === 0 ? <Card><p className="text-sm text-muted">No posts yet.</p></Card> : (
        <Card><ul className="divide-y divide-line">{posts.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><Link href={`/admin/blog/${p.id}`} className="font-semibold text-navy-800 hover:underline">{p.title}</Link><span className="flex items-center gap-3 text-xs text-muted"><Badge tone={p.is_published ? "green" : "gray"}>{p.is_published ? "Published" : "Draft"}</Badge>{pkt(p.updated_at)}</span></li>
        ))}</ul></Card>
      )}
    </div>
  );
}
