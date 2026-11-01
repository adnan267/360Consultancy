import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PackageForm } from "@/components/AdminPackages";
import { Card, Notice } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { getRepo, isDatabaseConfigured } from "@/lib/repo";
import { can } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function PackageEdit({ params }: { params: Promise<{ slug: string }> }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!can(session.role, "service:manage")) notFound();
  if (!isDatabaseConfigured()) return <Notice tone="warn">Database not configured.</Notice>;
  const { slug } = await params;
  const isNew = slug === "new";
  const pkg = isNew ? undefined : (await getRepo().listTourPackages()).find((p) => p.slug === slug);
  if (!isNew && !pkg) notFound();
  return (
    <div className="max-w-3xl space-y-4">
      <Link href="/admin/packages" className="text-sm font-semibold text-navy-700">← All packages</Link>
      <h1 className="text-2xl font-extrabold text-navy-900">{isNew ? "Add a package" : pkg!.title}</h1>
      <Card><PackageForm pkg={pkg} /></Card>
    </div>
  );
}
