import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GENERIC_PROCESS, INDICATIVE_CHECKLIST, getCountryContent } from "@/data/countries";
import { Flag } from "@/components/Flag";
import { FaqList, FeeLabel, FinalCta } from "@/components/sections";
import { Badge, ButtonLink, Card, Container, Notice, PageHero } from "@/components/ui";
import { getDestinationCountries, getPublicScholarships, getPublicServices } from "@/lib/catalog";
import { servicesEnabled } from "@/lib/env";

export const revalidate = 300;
type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getDestinationCountries()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = (await getDestinationCountries()).find((x) => x.slug === slug);
  if (!c) return {};
  return { title: `${c.name} visa guidance`, description: `General guidance and official source links for ${c.name}.`, alternates: { canonical: `/countries/${slug}` } };
}

const fmt = (d: string) => new Date(d).toLocaleDateString("en-GB", { dateStyle: "long" });

export default async function CountryPage({ params }: Props) {
  const { slug } = await params;
  const country = (await getDestinationCountries()).find((c) => c.slug === slug);
  const content = getCountryContent(slug);
  if (!country || !content) notFound();
  const [services, scholarships] = await Promise.all([getPublicServices(), getPublicScholarships({ country: slug })]);
  const enabled = servicesEnabled();

  return (
    <>
      <PageHero eyebrow="Destination" title={`${country.name} — visa guidance`} intro={content.intro}>
        <div className="flex flex-wrap items-center gap-3">
          <Flag code={content.flag} label={country.name} className="text-4xl" />
          <ButtonLink href={`/book?country=${country.slug}`}>Book a consultation</ButtonLink>
          <ButtonLink href={`/lp/${country.slug}#start`} variant="outline-light">Start free assessment</ButtonLink>
          {content.lastVerified ? <Badge tone="gold">Official details last verified {fmt(content.lastVerified)}</Badge> : <Badge tone="amber">Official details pending verification</Badge>}
        </div>
      </PageHero>
      <Container className="grid gap-10 py-16 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-10">
          {!content.lastVerified && (
            <Notice tone="warn" title="Check the official source">We have not yet verified the current rules, fees or processing times for {country.name}, so none are shown here. Please rely on the official links.</Notice>
          )}

          <section>
            <h2 className="text-2xl font-extrabold text-navy-900">Visa categories</h2>
            <p className="mt-2 text-sm text-muted">Typical categories — the exact names and rules are set by the authority.</p>
            <ul className="mt-4 flex flex-wrap gap-2">{content.categories.map((c) => <li key={c}><Badge tone="navy">{c}</Badge></li>)}</ul>
          </section>

          {content.facts.length > 0 && (
            <section>
              <h2 className="text-2xl font-extrabold text-navy-900">What the official page says</h2>
              <p className="mt-2 text-sm text-muted">Read from the official source on {content.lastVerified ? fmt(content.lastVerified) : "—"}. Rules can change — confirm before you act.</p>
              <ul className="mt-4 space-y-4">
                {content.facts.map((f) => (
                  <li key={f.text} className="rounded-xl border border-line bg-white p-4 shadow-card">
                    <p className="text-sm leading-relaxed text-ink">{f.text}</p>
                    <a href={f.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-navy-700 underline underline-offset-4">Source: {f.sourceLabel}<ExternalLink className="size-3" /></a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="text-2xl font-extrabold text-navy-900">General eligibility</h2>
            <p className="mt-3 leading-relaxed text-muted">Eligibility depends on the visa category, your personal circumstances and rules that change over time. Always read the eligibility section for your category on the official website before you plan or pay for anything.</p>
          </section>

          <section>
            <h2 className="text-2xl font-extrabold text-navy-900">Indicative document checklist</h2>
            <p className="mt-2 text-sm text-muted">A general list only — not a substitute for the official checklist. <Link href="/tools/document-checklist" className="font-semibold text-navy-700 underline underline-offset-4">Use the checklist tool</Link>.</p>
            <ul className="mt-4 space-y-2 text-muted">{INDICATIVE_CHECKLIST.map((i) => <li key={i} className="flex gap-3"><span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-gold-500" />{i}</li>)}</ul>
          </section>

          <section>
            <h2 className="text-2xl font-extrabold text-navy-900">Application process overview</h2>
            <ol className="mt-4 space-y-3">{GENERIC_PROCESS.map((s, i) => <li key={s} className="flex gap-4"><span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-gold-300">{i + 1}</span><span className="pt-0.5 text-muted">{s}</span></li>)}</ol>
          </section>

          {scholarships.length > 0 && (
            <section>
              <h2 className="text-2xl font-extrabold text-navy-900">Scholarships</h2>
              <ul className="mt-4 space-y-2">{scholarships.map((s) => <li key={s.id}><Link className="font-semibold text-navy-700 underline underline-offset-4" href={`/scholarships?country=${slug}`}>{s.name}</Link></li>)}</ul>
              <p className="mt-2 text-xs text-muted">Scholarships are competitive and never guaranteed.</p>
            </section>
          )}

          <section>
            <h2 className="mb-4 text-2xl font-extrabold text-navy-900">FAQs</h2>
            <FaqList items={content.faqs} />
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <Card>
            <h2 className="font-bold text-navy-900">Official sources</h2>
            <p className="mt-1 text-xs text-muted">{content.authority}</p>
            <ul className="mt-3 space-y-3">
              {content.officialLinks.map((l) => (
                <li key={l.url}>
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-2 text-sm font-semibold text-navy-700 underline-offset-4 hover:underline">{l.label}<ExternalLink className="mt-0.5 size-3.5 shrink-0" /></a>
                  <p className="text-xs text-muted">{l.checkedOn ? `Checked ${fmt(l.checkedOn)}` : "Link not yet checked by us"}</p>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">Official fees and processing times are published by the authority. We do not restate them here.</p>
          </Card>
          <Card>
            <h2 className="font-bold text-navy-900">How we can help</h2>
            <ul className="mt-3 space-y-3 text-sm">
              {services.map((s) => <li key={s.id} className="flex items-start justify-between gap-3"><span className="font-semibold text-navy-800">{s.title}</span>{enabled && <span className="shrink-0 text-muted"><FeeLabel service={s} /></span>}</li>)}
            </ul>
            <p className="mt-3 text-xs text-muted">Our fee is separate from government fees and never guarantees approval.</p>
            <ButtonLink href={`/book?country=${country.slug}`} className="mt-5 w-full">Book a consultation</ButtonLink>
            <ButtonLink href="/wizard" variant="secondary" className="mt-3 w-full">Find your visa options</ButtonLink>
          </Card>
        </aside>
      </Container>
      <FinalCta />
    </>
  );
}
