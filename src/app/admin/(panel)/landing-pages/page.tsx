import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Notice } from "@/components/ui";
import { NewLandingForm } from "@/components/AdminClient";
import { LANDING_PAGES } from "@/data/landing";
import { getSession } from "@/lib/auth";
import { getDestinationCountries } from "@/lib/catalog";
import { getRepo, isDatabaseConfigured } from "@/lib/repo";
import { can } from "@/lib/status";

export const metadata = { title: "Landing pages" };
export const dynamic = "force-dynamic";

type Item = { slug: string; title: string; status: "Default" | "Edited" | "Custom" | "Hidden" };

function List({ heading, items }: { heading: string; items: Item[] }) {
  return (
    <section className="space-y-2">
      <h2 className="font-bold text-navy-900">{heading}</h2>
      <ul className="divide-y divide-navy-100 rounded-2xl border border-navy-100 bg-white">
        {items.map((i) => (
          <li key={i.slug} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <span className="min-w-0">
              <span className="block font-semibold text-navy-900">{i.title}</span>
              <span className="block text-xs text-muted">/lp/{i.slug}</span>
            </span>
            <span className="flex items-center gap-3 text-sm">
              <span className={`rounded px-2 py-0.5 text-xs font-semibold ${i.status === "Default" ? "bg-navy-100 text-navy-700" : i.status === "Hidden" ? "bg-red-50 text-red-700" : "bg-gold-300 text-navy-900"}`}>{i.status}</span>
              <a href={`/lp/${i.slug}`} target="_blank" rel="noreferrer" className="font-semibold text-navy-700 hover:underline">View</a>
              <Link href={`/admin/landing-pages/${i.slug}`} className="font-semibold text-navy-700 hover:underline">Edit</Link>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function LandingPagesAdmin() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!can(session.role, "content:manage")) notFound();
  if (!isDatabaseConfigured()) return <Notice tone="warn">Database not configured.</Notice>;
  const [rows, countries] = await Promise.all([getRepo().listLandingPages(), getDestinationCountries()]);
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  const status = (slug: string, builtIn: boolean): Item["status"] => {
    const r = bySlug.get(slug);
    if (!r) return "Default";
    if (!r.is_published) return "Hidden";
    return builtIn ? "Edited" : "Custom";
  };
  const builtInSlugs = new Set([...LANDING_PAGES.map((l) => l.slug), ...countries.map((c) => c.slug)]);
  const services: Item[] = LANDING_PAGES.map((l) => ({ slug: l.slug, title: bySlug.get(l.slug)?.title ?? l.title, status: status(l.slug, true) }));
  const custom: Item[] = rows.filter((r) => !builtInSlugs.has(r.slug)).map((r) => ({ slug: r.slug, title: r.title, status: status(r.slug, false) }));
  const countryItems: Item[] = countries.map((c) => ({ slug: c.slug, title: bySlug.get(c.slug)?.title ?? `${c.name} visa guidance`, status: status(c.slug, true) }));

  return (
    <div className="max-w-4xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold text-navy-900">Landing pages</h1>
        <p className="text-sm text-muted">Pages for paid ads at <code>/lp/&lt;slug&gt;</code>. They are hidden from Google. Edit the headline, text, bullet points and FAQs, or add a new page. Ad platforms reject guarantees, invented fees, statistics or reviews — keep the copy factual.</p>
      </div>
      <NewLandingForm />
      {custom.length > 0 && <List heading="Your new pages" items={custom} />}
      <List heading="Service pages" items={services} />
      <List heading="Country pages" items={countryItems} />
    </div>
  );
}
