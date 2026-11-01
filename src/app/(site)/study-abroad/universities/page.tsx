import type { Metadata } from "next";
import Link from "next/link";
import { Flag } from "@/components/Flag";
import { FinalCta } from "@/components/sections";
import { NoGuarantee } from "@/components/study";
import { Button, Container, PageHero } from "@/components/ui";
import { getStudyDestinations, getUniversities, LEVELS, LEVEL_LABEL } from "@/lib/study";

export const metadata: Metadata = { title: "Find Your University", description: "Search universities by name, country and degree level. Each university page links to its official website and admission portal.", alternates: { canonical: "/study-abroad/universities" } };
export const dynamic = "force-dynamic";

const input = "rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-navy-700 focus:outline-none focus:ring-2 focus:ring-gold-500/60";

export default async function UniversitiesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const dests = await getStudyDestinations();
  const country = dests.some((d) => d.slug === sp.country) ? sp.country : undefined;
  const level = sp.level && (LEVELS as readonly string[]).includes(sp.level) ? sp.level : undefined;
  const q = sp.q?.trim().slice(0, 80) || undefined;
  const rows = await getUniversities({ q, country, level });
  const dest = (slug: string) => dests.find((d) => d.slug === slug);
  return (
    <>
      <PageHero eyebrow="Study abroad" title="Find your university" intro="Search by name, city, country or degree level. Scholarship availability is shown separately for each university, degree and intake — a listed university does not mean a scholarship is available." />
      <Container className="py-12">
        <form method="get" role="search" aria-label="University search" className="flex flex-wrap items-end gap-3">
          <div><label htmlFor="q" className="mb-1 block text-xs font-semibold">University or city</label><input id="q" name="q" defaultValue={q} maxLength={80} className={`${input} w-56`} /></div>
          <div><label htmlFor="country" className="mb-1 block text-xs font-semibold">Country</label><select id="country" name="country" defaultValue={country ?? ""} className={input}><option value="">All</option>{dests.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}</select></div>
          <div><label htmlFor="level" className="mb-1 block text-xs font-semibold">Degree level</label><select id="level" name="level" defaultValue={level ?? ""} className={input}><option value="">All</option>{LEVELS.map((l) => <option key={l} value={l}>{LEVEL_LABEL[l]}</option>)}</select></div>
          <Button type="submit" variant="dark">Search</Button><Link href="/study-abroad/universities" className="py-3 text-sm font-semibold text-navy-700 hover:underline">Reset</Link>
        </form>
        <p className="mt-6 text-sm text-muted" aria-live="polite">{rows.length} universit{rows.length === 1 ? "y" : "ies"} found</p>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{rows.map((u) => {
          const d = dest(u.country_slug);
          return (<li key={u.slug}><Link href={`/study-abroad/universities/${u.slug}`} className="flex h-full items-start gap-3 rounded-2xl border border-line bg-white p-4 shadow-card transition hover:border-gold-500">
            {d?.flag && <Flag code={d.flag} label={d.name} className="mt-0.5 text-2xl" />}
            <span><span className="block font-bold text-navy-900">{u.name}</span><span className="block text-sm text-muted">{[u.city, d?.name].filter(Boolean).join(", ")}</span></span>
          </Link></li>);
        })}</ul>
        {rows.length === 0 && <p className="mt-6 text-sm text-muted">No university matches. Try fewer filters, or ask us — we can check other universities for you.</p>}
        <div className="mt-10"><NoGuarantee /></div>
      </Container>
      <FinalCta />
    </>
  );
}
