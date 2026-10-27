import type { Metadata } from "next";
import { FinalCta } from "@/components/sections";
import { ButtonLink, Card, Container, Notice, PageHero } from "@/components/ui";
import { getPublicServices } from "@/lib/catalog";
import { formatPkr } from "@/lib/pricing";
import { site, whatsappLink } from "@/lib/site";

export const revalidate = 300;
export const metadata: Metadata = { title: "Umrah Packages & Planning", description: "Plan your Umrah with clear steps, documents and approved package options.", alternates: { canonical: "/umrah" } };

const STEPS = [
  ["Choose your timing", "Decide your travel window and how long you want to stay in Makkah and Madinah."],
  ["Prepare your documents", "A valid passport, photographs and any documents the official process or your package operator requires."],
  ["Choose an approved package", "Compare packages from licensed operators: hotel distance, duration, transport and what is included."],
  ["Confirm and travel", "Complete the official booking and visa steps and follow the guidance of your operator."],
];

export default async function UmrahPage() {
  const services = (await getPublicServices()).filter((s) => s.slug.startsWith("umrah"));
  const wa = whatsappLink();
  return (
    <>
      <PageHero eyebrow="Umrah" title="Umrah packages and planning" intro="Clear steps, honest information and approved package options for your Umrah.">
        <div className="flex flex-wrap gap-3"><ButtonLink href="/book">Book a consultation</ButtonLink>{wa && <ButtonLink href={wa} variant="outline-light">Ask on WhatsApp</ButtonLink>}</div>
      </PageHero>
      <Container className="space-y-14 py-14">
        <section aria-labelledby="pk">
          <h2 id="pk" className="text-2xl font-extrabold text-navy-900">Packages</h2>
          {services.length > 0 ? (
            <ul className="mt-6 grid gap-5 md:grid-cols-2">
              {services.map((s) => (
                <li key={s.slug}><Card className="h-full">
                  <h3 className="text-lg font-bold text-navy-900">{s.title}</h3>
                  <p className="mt-2 text-muted">{s.summary}</p>
                  {s.fee_pkr > 0 && <p className="mt-3 font-bold text-navy-900">{s.fee_is_starting_price ? "From " : ""}{formatPkr(s.fee_pkr)}</p>}
                  <ButtonLink href={`/book?service=${s.slug}`} variant="secondary" className="mt-5">Get started</ButtonLink>
                </Card></li>
              ))}
            </ul>
          ) : (
            <Card className="mt-6">
              <p className="font-bold text-navy-900">Our Umrah packages are being finalised.</p>
              <p className="mt-2 text-muted">We only list packages that are fully confirmed with licensed operators, with the price and inclusions shown clearly. Message us to be told as soon as they open.</p>
              <div className="mt-4 flex flex-wrap gap-3">{wa && <ButtonLink href={wa} variant="secondary">Message us on WhatsApp</ButtonLink>}{site.contact.email && <ButtonLink href={`mailto:${site.contact.email}`} variant="secondary">Email us</ButtonLink>}</div>
            </Card>
          )}
        </section>
        <section aria-labelledby="how">
          <h2 id="how" className="text-2xl font-extrabold text-navy-900">How Umrah planning works</h2>
          <ol className="mt-6 grid gap-5 md:grid-cols-2">{STEPS.map(([t, d], i) => (<li key={t}><Card className="h-full"><p className="text-sm font-bold text-gold-700">Step {i + 1}</p><h3 className="mt-1 text-lg font-bold text-navy-900">{t}</h3><p className="mt-2 text-muted">{d}</p></Card></li>))}</ol>
        </section>
        <section aria-labelledby="links">
          <h2 id="links" className="text-2xl font-extrabold text-navy-900">Official sources</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-muted">
            <li><a className="font-semibold text-navy-700 underline" href="https://nusuk.sa" target="_blank" rel="noopener noreferrer">Nusuk (official Umrah platform)</a></li>
            <li><a className="font-semibold text-navy-700 underline" href="https://www.haj.gov.sa" target="_blank" rel="noopener noreferrer">Ministry of Hajj and Umrah, Saudi Arabia</a></li>
            <li><a className="font-semibold text-navy-700 underline" href="https://mora.gov.pk" target="_blank" rel="noopener noreferrer">Ministry of Religious Affairs, Pakistan</a></li>
          </ul>
        </section>
        <Notice tone="warn" title="Please note">Visa rules, dates and requirements for Umrah are set by the Saudi authorities and can change. We provide planning guidance and do not guarantee visa approval or travel dates. Always use approved, licensed operators.</Notice>
      </Container>
      <FinalCta />
    </>
  );
}
