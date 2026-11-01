import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, Notice } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { formatPackagePrice } from "@/lib/packages";
import { getRepo, isDatabaseConfigured } from "@/lib/repo";
import { can } from "@/lib/status";

export const metadata = { title: "Packages" };
export const dynamic = "force-dynamic";

export default async function PackagesAdmin() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!can(session.role, "service:manage")) return <Notice tone="error">You do not have permission to manage packages.</Notice>;
  if (!isDatabaseConfigured()) return <Notice tone="warn">Database not configured.</Notice>;
  const rows = await getRepo().listTourPackages();
  const groups: [string, typeof rows][] = [["Tour packages", rows.filter((r) => r.category === "tour")], ["Religious tour packages", rows.filter((r) => r.category === "religious")]];
  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold text-navy-900">Packages</h1><p className="mt-1 text-sm text-muted">Tour packages and religious tour packages shown on the website. Each package has its own price, and you decide whether the price is shown.</p></div>
        <Link href="/admin/packages/new" className="rounded-xl bg-navy-900 px-4 py-2 text-sm font-bold text-white hover:bg-navy-800">+ Add package</Link>
      </div>
      {groups.map(([heading, items]) => (
        <section key={heading} className="space-y-2">
          <h2 className="font-bold text-navy-900">{heading}</h2>
          {items.length ? (
            <ul className="divide-y divide-navy-100 rounded-2xl border border-navy-100 bg-white">{items.map((p) => (
              <li key={p.slug} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <span className="min-w-0"><span className="block font-semibold text-navy-900">{p.title}</span><span className="block text-xs text-muted">{p.section ? `${p.section} · ` : ""}{p.price_pkr ? `PKR ${p.price_pkr.toLocaleString("en-PK")} ${p.price_note}` : "No price saved"}</span></span>
                <span className="flex items-center gap-3 text-sm">
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${formatPackagePrice(p) ? "bg-gold-300 text-navy-900" : "bg-navy-100 text-navy-700"}`}>{formatPackagePrice(p) ? "Price shown" : "Price hidden"}</span>
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${p.is_published ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{p.is_published ? "Published" : "Hidden"}</span>
                  <Link href={`/admin/packages/${p.slug}`} className="font-semibold text-navy-700 hover:underline">Edit</Link>
                </span>
              </li>
            ))}</ul>
          ) : <Card><p className="text-sm text-muted">No packages yet. Add one and it appears on the matching page.</p></Card>}
        </section>
      ))}
    </div>
  );
}
