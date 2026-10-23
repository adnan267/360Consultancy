import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Flag } from "@/components/Flag";
import { Badge, Button, Card, Container, Notice, PageHero } from "@/components/ui";
import { COUNTRY_CONTENT } from "@/data/countries";
import { getDestinationCountries, getPublicScholarships } from "@/lib/catalog";

export const metadata: Metadata = { title: "Compare Countries", description: "Compare official authorities, official links and what we have verified for each destination.", alternates: { canonical: "/compare" } };
export const dynamic = "force-dynamic";

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ c?: string | string[] }> }) {
  const sp = await searchParams;
  const countries = await getDestinationCountries();
  const picked = (Array.isArray(sp.c) ? sp.c : sp.c ? [sp.c] : []).filter((s) => countries.some((c) => c.slug === s)).slice(0, 3);
  const scholarships = await getPublicScholarships();
  const rows = picked.flatMap((slug) => {
    const c = countries.find((x) => x.slug === slug);
    const content = COUNTRY_CONTENT.find((x) => x.slug === slug);
    return c && content ? [{ c, content, schol: scholarships.filter((s) => s.country_slug === slug).length }] : [];
  });

  return (
    <>
      <PageHero eyebrow="Compare" title="Compare destinations" intro="We compare only what we hold from official sources. For rules, fees and processing times, use each official website." />
      <Container className="py-12">
        <Card>
          <form method="get" className="space-y-4">
            <fieldset><legend className="mb-3 text-base font-bold text-navy-900">Choose up to 3 countries</legend>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {countries.map((c) => { const f = COUNTRY_CONTENT.find((x) => x.slug === c.slug)?.flag; return (
                  <label key={c.slug} className="flex cursor-pointer items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-sm font-semibold has-[:checked]:border-navy-800 has-[:checked]:bg-mist">
                    <input type="checkbox" name="c" value={c.slug} defaultChecked={picked.includes(c.slug)} className="size-4 accent-navy-800" />{f && <Flag code={f} label={c.name} className="text-lg" />}{c.name}
                  </label>); })}
              </div>
            </fieldset>
            <Button type="submit" variant="dark">Compare</Button>
          </form>
        </Card>

        {rows.length >= 2 ? (
          <div className="mt-8 overflow-x-auto rounded-2xl border border-line bg-white shadow-card">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <caption className="sr-only">Comparison of selected destinations</caption>
              <thead><tr className="bg-navy-900 text-white"><th scope="col" className="px-4 py-3 font-semibold">&nbsp;</th>{rows.map(({ c, content }) => <th key={c.slug} scope="col" className="px-4 py-3"><span className="flex items-center gap-2"><Flag code={content.flag} label={c.name} className="text-xl" />{c.name}</span></th>)}</tr></thead>
              <tbody className="divide-y divide-line align-top">
                <tr><th scope="row" className="px-4 py-3 font-semibold text-navy-900">Official authority</th>{rows.map(({ c, content }) => <td key={c.slug} className="px-4 py-3 text-muted">{content.authority}</td>)}</tr>
                <tr><th scope="row" className="px-4 py-3 font-semibold text-navy-900">Official source</th>{rows.map(({ c, content }) => <td key={c.slug} className="px-4 py-3"><ul className="space-y-1">{content.officialLinks.map((l) => <li key={l.url}><a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-navy-700 underline underline-offset-4">{l.label}<ExternalLink className="size-3.5" /></a></li>)}</ul></td>)}</tr>
                <tr><th scope="row" className="px-4 py-3 font-semibold text-navy-900">Visa categories (as we list them)</th>{rows.map(({ c, content }) => <td key={c.slug} className="px-4 py-3 text-muted">{content.categories.join(" · ")}</td>)}</tr>
                <tr><th scope="row" className="px-4 py-3 font-semibold text-navy-900">Official details verified by us</th>{rows.map(({ c, content }) => <td key={c.slug} className="px-4 py-3">{content.lastVerified ? <Badge tone="green">Verified {new Date(content.lastVerified).toLocaleDateString("en-GB", { dateStyle: "medium" })}</Badge> : <Badge tone="amber">Pending verification</Badge>}</td>)}</tr>
                <tr><th scope="row" className="px-4 py-3 font-semibold text-navy-900">Scholarship records in our finder</th>{rows.map(({ c, schol }) => <td key={c.slug} className="px-4 py-3 text-muted">{schol ? <Link className="font-semibold text-navy-700 underline underline-offset-4" href={`/scholarships?country=${c.slug}`}>{schol} record{schol === 1 ? "" : "s"}</Link> : "None verified yet"}</td>)}</tr>
                <tr><th scope="row" className="px-4 py-3 font-semibold text-navy-900">Our guidance</th>{rows.map(({ c }) => <td key={c.slug} className="px-4 py-3"><Link className="font-semibold text-navy-700 underline underline-offset-4" href={`/countries/${c.slug}`}>Country page →</Link></td>)}</tr>
              </tbody>
            </table>
          </div>
        ) : picked.length ? <div className="mt-8"><Notice tone="info">Select at least two countries to compare.</Notice></div> : null}
        <div className="mt-8"><Notice tone="warn" title="What this does not compare">Fees, processing times, eligibility and approval rates are set by each authority and change often, so we do not rank or estimate them here.</Notice></div>
      </Container>
    </>
  );
}
