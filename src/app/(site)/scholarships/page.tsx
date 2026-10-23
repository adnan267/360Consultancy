import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { DEGREE_LEVEL_LABEL } from "@/data/scholarships";
import { COUNTRY_CONTENT } from "@/data/countries";
import { Flag } from "@/components/Flag";
import { Badge, Button, Card, Container, Notice, PageHero } from "@/components/ui";
import { getDestinationCountries, getPublicScholarships } from "@/lib/catalog";
import { FUNDING_LABEL, FUNDING_TYPES, type FundingType } from "@/lib/types";

export const metadata: Metadata = { title: "Scholarship Finder", description: "Search scholarship records with funding type, eligibility summary, official source and last-verified date.", alternates: { canonical: "/scholarships" } };
export const dynamic = "force-dynamic";

const input = "rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-navy-700 focus:outline-none focus:ring-2 focus:ring-gold-500/60";
const tone = { full: "green", partial: "amber", other: "navy", not_stated: "gray" } as const;

export default async function ScholarshipsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const countries = await getDestinationCountries();
  const funding = FUNDING_TYPES.includes(sp.funding as FundingType) ? (sp.funding as FundingType) : undefined;
  const country = countries.some((c) => c.slug === sp.country) ? sp.country : undefined;
  const level = sp.level && sp.level in DEGREE_LEVEL_LABEL ? sp.level : undefined;
  const q = sp.q?.trim().slice(0, 80) || undefined;
  const results = await getPublicScholarships({ q, country, level, funding });
  const countryName = (slug: string) => countries.find((c) => c.slug === slug)?.name ?? slug;

  return (
    <>
      <PageHero eyebrow="Scholarship finder" title="Search scholarships — verified against official sources" intro="Every record links to its official page and shows when we last checked it. Scholarships are competitive; none is guaranteed." />
      <Container className="py-12">
        <form method="get" className="flex flex-wrap items-end gap-3" role="search" aria-label="Scholarship search">
          <div><label htmlFor="q" className="mb-1 block text-xs font-semibold">Keyword</label><input id="q" name="q" defaultValue={q} maxLength={80} className={`${input} w-56`} placeholder="Name, provider…" /></div>
          <div><label htmlFor="country" className="mb-1 block text-xs font-semibold">Country</label><select id="country" name="country" defaultValue={country ?? ""} className={input}><option value="">All</option>{countries.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></div>
          <div><label htmlFor="level" className="mb-1 block text-xs font-semibold">Degree level</label><select id="level" name="level" defaultValue={level ?? ""} className={input}><option value="">All</option>{Object.entries(DEGREE_LEVEL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <div><label htmlFor="funding" className="mb-1 block text-xs font-semibold">Funding</label><select id="funding" name="funding" defaultValue={funding ?? ""} className={input}><option value="">All</option>{FUNDING_TYPES.map((f) => <option key={f} value={f}>{FUNDING_LABEL[f]}</option>)}</select></div>
          <Button type="submit" variant="dark">Search</Button>
          <a href="/scholarships" className="py-3 text-sm font-semibold text-navy-700 hover:underline">Reset</a>
        </form>

        <p className="mt-6 text-sm text-muted" aria-live="polite">{results.length} record{results.length === 1 ? "" : "s"} found</p>

        <ul className="mt-4 space-y-5">
          {results.map((s) => {
            const flag = COUNTRY_CONTENT.find((c) => c.slug === s.country_slug)?.flag;
            return (
              <li key={s.id}>
                <Card className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {flag && <Flag code={flag} label={countryName(s.country_slug)} className="mt-1 text-2xl" />}
                      <div><h2 className="text-xl font-extrabold text-navy-900">{s.name}</h2><p className="text-sm text-muted">{countryName(s.country_slug)} · {s.provider}</p></div>
                    </div>
                    <Badge tone={tone[s.funding_type]}>{FUNDING_LABEL[s.funding_type]}</Badge>
                  </div>
                  <dl className="mt-5 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                    <div><dt className="font-semibold text-navy-900">Degree levels</dt><dd className="text-muted">{s.degree_levels.map((l) => DEGREE_LEVEL_LABEL[l] ?? l).join(", ")}</dd></div>
                    <div><dt className="font-semibold text-navy-900">Deadline</dt><dd className="text-muted">{s.deadline ? new Date(s.deadline).toLocaleDateString("en-GB", { dateStyle: "long" }) : "Not stated"} — {s.deadline_note}</dd></div>
                    <div className="sm:col-span-2"><dt className="font-semibold text-navy-900">Funding details</dt><dd className="text-muted">{s.funding_details}</dd></div>
                    <div className="sm:col-span-2"><dt className="font-semibold text-navy-900">Eligibility summary</dt><dd className="text-muted">{s.eligibility_summary}</dd></div>
                  </dl>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-sm">
                    <a href={s.official_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-bold text-navy-700 underline-offset-4 hover:underline">Official source <ExternalLink className="size-4" /></a>
                    <span className="text-muted">{s.last_verified ? `Last verified ${new Date(s.last_verified).toLocaleDateString("en-GB", { dateStyle: "long" })}` : "Not yet verified"}</span>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
        {results.length === 0 && <div className="mt-6"><Notice tone="info" title="No records match">Try fewer filters. Our finder lists only scholarships whose official page we have read, so it is still small.</Notice></div>}
        <div className="mt-10"><Notice tone="warn" title="How to read this list">Funding is shown as the provider describes it: “full”, “partial”, “other aid”, or “not stated”. Deadlines change every cycle — always confirm on the official page. We never guarantee a scholarship.</Notice></div>
      </Container>
    </>
  );
}
