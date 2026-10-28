import { Check } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Wizard } from "@/components/Wizard";
import { FaqList } from "@/components/sections";
import { Container } from "@/components/ui";
import { COUNTRY_CONTENT, getCountryContent } from "@/data/countries";
import { PROCESS_STEPS } from "@/data/faq";
import { getDestinationCountries, getPublicServices, getActiveQuestions } from "@/lib/catalog";
import { leadsEnabled } from "@/lib/env";
import { countryLanding, getPublicLanding, listPublicLandingSlugs } from "@/lib/landing";
import { whatsappLink } from "@/lib/site";

export const revalidate = 300;
type Props = { params: Promise<{ slug: string }> };

async function resolve(slug: string) {
  const l = await getPublicLanding(slug);
  if (l === "hidden") return null;
  if (l) return { kind: "service" as const, l };
  const country = (await getDestinationCountries()).find((c) => c.slug === slug);
  const content = getCountryContent(slug);
  if (country && content) return { kind: "country" as const, country, content };
  return null;
}

export async function generateStaticParams() {
  const slugs = new Set([...(await listPublicLandingSlugs()), ...(await getDestinationCountries()).map((c) => c.slug)]);
  return [...slugs].map((slug) => ({ slug }));
}

// Ad landing pages are for paid traffic only: keep them out of search results.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = await resolve((await params).slug);
  if (!r) return {};
  return { title: r.kind === "service" ? r.l.title : `${r.country.name} visa guidance`, robots: { index: false, follow: true } };
}

export default async function LandingPageView({ params }: Props) {
  const { slug } = await params;
  const r = await resolve(slug);
  if (!r) notFound();
  const [countries, services, questions] = await Promise.all([getDestinationCountries(), getPublicServices(), getActiveQuestions()]);
  const wa = whatsappLink();

  const content = r.kind === "service"
    ? { headline: r.l.headline, sub: r.l.sub, bullets: r.l.bullets, faqs: r.l.faqs, preset: { purpose: r.l.purpose, ...(r.l.destination ? { destination: r.l.destination as never } : {}) } }
    : { ...countryLanding(r.country, [...r.content.faqs]), preset: { destination: r.country.slug as never } };

  return (
    <>
      <section className="bg-navy-950 text-white">
        <Container className="grid gap-8 py-12 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:py-16">
          <div>
            <p className="mb-4 inline-block rounded-md bg-gold-400 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-navy-950">360 Consultancy</p>
            <h1 className="text-balance text-3xl font-black leading-tight sm:text-5xl">{content.headline}</h1>
            <p className="mt-4 max-w-xl text-lg text-white/90">{content.sub}</p>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {content.bullets.map((b) => <li key={b} className="flex items-start gap-2 text-sm font-semibold"><Check aria-hidden className="mt-0.5 size-4 shrink-0 text-gold-400" />{b}</li>)}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#start" className="rounded-xl bg-gold-500 px-6 py-3.5 text-base font-bold text-navy-950 hover:bg-gold-400">Start your free assessment</a>
              {wa && <a href={wa} className="rounded-xl border border-white/40 px-6 py-3.5 text-base font-bold hover:bg-white/10">Chat on WhatsApp</a>}
            </div>
            <p className="mt-4 text-xs text-white/70">The assessment is a planning tool, not an eligibility decision. No visa outcome is guaranteed.</p>
          </div>
          <ol className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/15">
            <li className="mb-3 text-sm font-bold uppercase tracking-wider text-gold-400">How it works</li>
            {PROCESS_STEPS.map((s, i) => <li key={s.title} className="flex gap-3 py-1.5 text-sm"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gold-500 text-xs font-bold text-navy-950">{i + 1}</span><span>{s.title}</span></li>)}
          </ol>
        </Container>
      </section>

      <section id="start" className="scroll-mt-4 bg-mist py-14">
        <Container>
          <h2 className="mb-2 text-center text-2xl font-extrabold text-navy-900 sm:text-3xl">Start your free assessment</h2>
          <p className="mx-auto mb-8 max-w-xl text-center text-muted">A few quick questions, then save your details and we will be in touch.</p>
          <Wizard
            lp={slug}
            preset={content.preset}
            leadsEnabled={leadsEnabled()}
            questions={questions.map((q) => ({ id: q.id, label: q.label, help: q.help, kind: q.kind, options: q.options, purpose: q.purpose, required: q.required }))}
            countries={countries.flatMap((c) => { const f = COUNTRY_CONTENT.find((x) => x.slug === c.slug)?.flag; return f ? [{ slug: c.slug, name: c.name, flag: f }] : []; })}
            services={services.map((x) => ({ slug: x.slug, title: x.title, summary: x.summary }))}
          />
        </Container>
      </section>

      {services.length > 0 && (
        <section className="py-14">
          <Container>
            <h2 className="mb-6 text-2xl font-extrabold text-navy-900">How we can help</h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.slice(0, 6).map((x) => <li key={x.slug} className="rounded-2xl border border-line bg-white p-5 shadow-card"><h3 className="font-bold text-navy-900">{x.title}</h3><p className="mt-1 text-sm text-muted">{x.summary}</p></li>)}
            </ul>
            <p className="mt-4 text-xs text-muted">Our fee is separate from government and embassy fees and never guarantees approval.</p>
          </Container>
        </section>
      )}

      <section className="bg-mist py-14">
        <Container className="max-w-3xl">
          <h2 className="mb-4 text-2xl font-extrabold text-navy-900">Common questions</h2>
          <FaqList items={content.faqs} />
        </Container>
      </section>
    </>
  );
}
