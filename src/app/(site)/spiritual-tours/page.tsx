import type { Metadata } from "next";
import { FinalCta } from "@/components/sections";
import { ButtonLink, Card, Container, Notice, PageHero } from "@/components/ui";
import { getPublicServices } from "@/lib/catalog";
import { formatPkr } from "@/lib/pricing";
import { whatsappLink } from "@/lib/site";

export const revalidate = 300;
export const metadata: Metadata = { title: "Holy & Spiritual Tours", description: "Planning support for religious and spiritual journeys, with official requirements explained.", alternates: { canonical: "/spiritual-tours" } };

const PLACES = [
  ["Makkah and Madinah", "Umrah and ziyarat of the holy places in Saudi Arabia."],
  ["Iraq", "Ziyarat of the holy shrines, subject to current official travel requirements."],
  ["Iran", "Ziyarat and spiritual travel, subject to current official travel requirements."],
  ["Türkiye and Jordan", "Historic Islamic and spiritual sites and heritage."],
];

export default async function SpiritualToursPage() {
  const services = (await getPublicServices()).filter((s) => s.slug.startsWith("spiritual"));
  const wa = whatsappLink();
  return (
    <>
      <PageHero eyebrow="Spiritual tours" title="Holy and spiritual tour planning" intro="Plan a meaningful journey with clear documents, timing and official requirements.">
        <div className="flex flex-wrap gap-3"><ButtonLink href="/book">Book a consultation</ButtonLink><ButtonLink href="/umrah" variant="outline-light">Umrah packages</ButtonLink></div>
      </PageHero>
      <Container className="space-y-14 py-14">
        <section aria-labelledby="places">
          <h2 id="places" className="text-2xl font-extrabold text-navy-900">Journeys we can help you plan</h2>
          <ul className="mt-6 grid gap-5 md:grid-cols-2">{PLACES.map(([t, d]) => (<li key={t}><Card className="h-full"><h3 className="text-lg font-bold text-navy-900">{t}</h3><p className="mt-2 text-muted">{d}</p></Card></li>))}</ul>
        </section>
        <section aria-labelledby="svc">
          <h2 id="svc" className="text-2xl font-extrabold text-navy-900">Planning service</h2>
          {services.length > 0 ? (
            <ul className="mt-6 grid gap-5 md:grid-cols-2">{services.map((s) => (
              <li key={s.slug}><Card className="h-full"><h3 className="text-lg font-bold text-navy-900">{s.title}</h3><p className="mt-2 text-muted">{s.summary}</p>{s.fee_pkr > 0 && <p className="mt-3 font-bold text-navy-900">{s.fee_is_starting_price ? "From " : ""}{formatPkr(s.fee_pkr)}</p>}<ButtonLink href={`/book?service=${s.slug}`} variant="secondary" className="mt-5">Get started</ButtonLink></Card></li>
            ))}</ul>
          ) : (
            <Card className="mt-6"><p className="font-bold text-navy-900">Tour planning is opening soon.</p><p className="mt-2 text-muted">We list a service only once its fee and licensed partners are confirmed. Message us to hear when it opens.</p>{wa && <ButtonLink href={wa} variant="secondary" className="mt-4">Message us on WhatsApp</ButtonLink>}</Card>
          )}
        </section>
        <Notice tone="warn" title="Check official advice first">Travel conditions and visa rules for religious destinations can change quickly. Check your government's travel advice and the official entry requirements before you plan or pay. We provide planning guidance only and do not guarantee visas or travel dates. Tours are operated by licensed partners.</Notice>
      </Container>
      <FinalCta />
    </>
  );
}
