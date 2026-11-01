import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PackageCard } from "@/components/PackageCard";
import { FaqList, FinalCta } from "@/components/sections";
import { ButtonLink, Card, Container, Notice, PageHero } from "@/components/ui";
import { getReligious, RELIGIOUS_SUBCATEGORIES } from "@/data/religious";
import { getPackages } from "@/lib/packages";
import { whatsappLink } from "@/lib/site";

export const revalidate = 300;
export function generateStaticParams() {
  return RELIGIOUS_SUBCATEGORIES.map((s) => ({ section: s.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ section: string }> }): Promise<Metadata> {
  const s = getReligious((await params).section);
  if (!s) return {};
  return { title: s.title, description: s.short, alternates: { canonical: `/religious-tours/${s.slug}` } };
}

export default async function ReligiousSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const s = getReligious((await params).section);
  if (!s) notFound();
  const packages = s.infoOnly ? [] : await getPackages({ category: "religious", section: s.slug });
  const wa = whatsappLink(`Hello 360 Consultancy, I would like a quote for: ${s.title}.`);
  return (
    <>
      <PageHero eyebrow="Religious & spiritual tours" title={s.title} intro={s.short}>
        {!s.infoOnly && <div className="flex flex-wrap gap-3">{wa && <ButtonLink href={wa}>Get a quote</ButtonLink>}<ButtonLink href="/book" variant="outline-light">Book a consultation</ButtonLink></div>}
      </PageHero>
      <Container className="space-y-12 py-14">
        {s.warning && <Notice tone="warn" title="Important">{s.warning}</Notice>}
        <section><p className="max-w-3xl text-lg leading-relaxed text-muted">{s.intro}</p></section>

        <section aria-labelledby="places">
          <h2 id="places" className="text-2xl font-extrabold text-navy-900">{s.slug === "jerusalem-al-aqsa" ? "About the sites" : "Places covered"}</h2>
          <ul className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{s.places.map((p) => <li key={p.name}><Card className="h-full"><h3 className="font-bold text-navy-900">{p.name}</h3><p className="mt-1 text-sm text-muted">{p.note}</p></Card></li>)}</ul>
        </section>

        {!s.infoOnly && (
          <section aria-labelledby="pk">
            <h2 id="pk" className="text-2xl font-extrabold text-navy-900">Packages</h2>
            {packages.length > 0 ? (
              <ul className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{packages.map((p) => <li key={p.slug}><PackageCard p={p} /></li>)}</ul>
            ) : (
              <Card className="mt-5"><p className="font-bold text-navy-900">Tell us your dates and group size.</p><p className="mt-1 text-sm text-muted">We will check the current requirements and send a written quote with what is included and the price.</p>{wa && <div className="mt-4"><ButtonLink href={wa}>Get a quote on WhatsApp</ButtonLink></div>}</Card>
            )}
          </section>
        )}

        <section aria-labelledby="prep">
          <h2 id="prep" className="text-2xl font-extrabold text-navy-900">{s.infoOnly ? "What to do" : "What to prepare"}</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">{s.prepare.map((x) => <li key={x} className="rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-navy-900">{x}</li>)}</ul>
        </section>

        {s.officialLinks.length > 0 && (
          <section aria-labelledby="off">
            <h2 id="off" className="text-2xl font-extrabold text-navy-900">Official sources</h2>
            <ul className="mt-4 space-y-2">{s.officialLinks.map((l) => <li key={l.url}><a href={l.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-navy-700 underline underline-offset-4">{l.label}</a></li>)}</ul>
            <p className="mt-2 text-sm text-muted">Rules, fees and dates change. Always confirm on the official source.</p>
          </section>
        )}

        <section aria-labelledby="faq"><h2 id="faq" className="text-2xl font-extrabold text-navy-900">Questions</h2><div className="mt-4 max-w-3xl"><FaqList items={s.faqs} /></div></section>
        <p className="text-sm text-muted">More journeys: {RELIGIOUS_SUBCATEGORIES.filter((x) => x.slug !== s.slug).map((x, i) => <span key={x.slug}>{i > 0 && " · "}<Link href={`/religious-tours/${x.slug}`} className="font-semibold underline">{x.title}</Link></span>)}</p>
      </Container>
      <FinalCta />
    </>
  );
}
