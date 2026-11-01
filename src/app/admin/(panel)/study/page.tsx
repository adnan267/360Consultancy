import Link from "next/link";
import { redirect } from "next/navigation";
import { Notice } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { getRepo, isDatabaseConfigured } from "@/lib/repo";
import { can } from "@/lib/status";
import { ensureStudySeed } from "@/lib/study";

export const metadata = { title: "Study Abroad" };
export const dynamic = "force-dynamic";

export default async function StudyAdmin() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!can(session.role, "content:manage")) return <Notice tone="error">You do not have permission to manage study-abroad content.</Notice>;
  if (!isDatabaseConfigured()) return <Notice tone="warn">Database not configured.</Notice>;
  await ensureStudySeed();
  const repo = getRepo();
  const [dests, unis, schol] = await Promise.all([repo.listStudyDestinations(), repo.listUniversities(), repo.listScholarships({})]);
  const groups = [
    { kind: "destinations", title: "Study destinations (countries)", items: dests.map((d) => ({ slug: d.slug, name: d.name, sub: d.region, on: d.is_published })) },
    { kind: "universities", title: "Universities", items: unis.map((u) => ({ slug: u.slug, name: u.name, sub: `${u.city} · ${u.country_slug}`, on: u.is_published })) },
    { kind: "scholarships", title: "Scholarships", items: schol.map((s) => ({ slug: s.slug, name: s.name, sub: `${s.country_slug} · ${s.funding_type}${s.last_verified ? ` · verified ${s.last_verified}` : " · not verified"}`, on: s.is_published })) },
  ];
  return (
    <div className="max-w-4xl space-y-8">
      <div><h1 className="text-2xl font-extrabold text-navy-900">Study Abroad</h1><p className="mt-1 text-sm text-muted">Countries, universities and scholarships shown under Study Abroad. Add unlimited records. Fill only officially confirmed facts; blank fields show “check the official site”.</p></div>
      {groups.map((g) => (
        <section key={g.kind} className="space-y-2">
          <div className="flex items-center justify-between"><h2 className="font-bold text-navy-900">{g.title} ({g.items.length})</h2><Link href={`/admin/study/${g.kind}/new`} className="rounded-xl bg-navy-900 px-3 py-1.5 text-sm font-bold text-white hover:bg-navy-800">+ Add</Link></div>
          <ul className="divide-y divide-navy-100 rounded-2xl border border-navy-100 bg-white">{g.items.map((i) => (
            <li key={i.slug} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
              <span className="min-w-0"><span className="block font-semibold text-navy-900">{i.name}</span><span className="block text-xs text-muted">{i.sub}</span></span>
              <span className="flex items-center gap-3 text-sm"><span className={`rounded px-2 py-0.5 text-xs font-semibold ${i.on ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{i.on ? "Published" : "Hidden"}</span><Link href={`/admin/study/${g.kind}/${i.slug}`} className="font-semibold text-navy-700 hover:underline">Edit</Link></span>
            </li>
          ))}</ul>
        </section>
      ))}
    </div>
  );
}
