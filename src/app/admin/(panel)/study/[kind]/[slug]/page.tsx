import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StudyForm } from "@/components/AdminStudy";
import { Card, Notice } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { getRepo, isDatabaseConfigured } from "@/lib/repo";
import { can } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function StudyEdit({ params }: { params: Promise<{ kind: string; slug: string }> }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!can(session.role, "content:manage")) notFound();
  if (!isDatabaseConfigured()) return <Notice tone="warn">Database not configured.</Notice>;
  const { kind, slug } = await params;
  if (kind !== "destinations" && kind !== "universities" && kind !== "scholarships") notFound();
  const repo = getRepo();
  const isNew = slug === "new";
  let row: object | undefined;
  if (!isNew) {
    row = kind === "destinations" ? (await repo.listStudyDestinations()).find((x) => x.slug === slug) : kind === "universities" ? (await repo.listUniversities()).find((x) => x.slug === slug) : (await repo.listScholarships({})).find((x) => x.slug === slug);
    if (!row) notFound();
  }
  const title = isNew ? `Add ${kind === "destinations" ? "a destination" : kind === "universities" ? "a university" : "a scholarship"}` : String((row as { name: string }).name);
  return (
    <div className="max-w-3xl space-y-4">
      <Link href="/admin/study" className="text-sm font-semibold text-navy-700">← Study Abroad</Link>
      <h1 className="text-2xl font-extrabold text-navy-900">{title}</h1>
      <Card><StudyForm kind={kind} slug={isNew ? undefined : slug} row={row as Record<string, unknown> | undefined} /></Card>
    </div>
  );
}
