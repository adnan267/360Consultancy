import type { Metadata } from "next";
import Link from "next/link";
import { FinalCta } from "@/components/sections";
import { ButtonLink, Card, Container, Notice, PageHero } from "@/components/ui";
import { RELIGIOUS_SUBCATEGORIES } from "@/data/religious";
import { whatsappLink } from "@/lib/site";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Religious & Spiritual Tours",
  description: "Umrah, Hajj guidance, Makkah and Madinah ziyarat, Iraq and Iran ziyarat and other religious tours, with documents and official requirements explained.",
  alternates: { canonical: "/religious-tours" },
};

export default function ReligiousToursPage() {
  const wa = whatsappLink("Hello 360 Consultancy, I would like help planning a religious tour.");
  return (
    <>
      <PageHero eyebrow="Religious & spiritual tours" title="Religious & Spiritual Tours" intro="Plan a meaningful journey with clear documents, timing and official requirements.">
        <div className="flex flex-wrap gap-3"><ButtonLink href="/book">Book a consultation</ButtonLink>{wa && <ButtonLink href={wa} variant="outline-light">Ask on WhatsApp</ButtonLink>}</div>
      </PageHero>
      <Container className="space-y-12 py-14">
        <section aria-labelledby="cats">
          <h2 id="cats" className="text-2xl font-extrabold text-navy-900">Choose your journey</h2>
          <ul className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {RELIGIOUS_SUBCATEGORIES.map((s) => (
              <li key={s.slug}>
                <Link href={`/religious-tours/${s.slug}`} className="flex h-full flex-col rounded-2xl border border-line bg-white p-6 shadow-card transition hover:-translate-y-1 hover:border-gold-500 hover:shadow-lift">
                  <h3 className="text-lg font-bold text-navy-900">{s.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{s.short}</p>
                  <span className="mt-4 text-sm font-bold text-navy-700">View details →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <Card>
          <h2 className="text-xl font-extrabold text-navy-900">How we help</h2>
          <ul className="mt-3 grid gap-2 text-sm text-muted sm:grid-cols-2">
            {["Explain the current visa and document steps", "Check your documents before you submit", "Share a written quote with what is and is not included", "Support you on WhatsApp, chat or call"].map((x) => <li key={x} className="rounded-lg bg-mist px-4 py-3 font-semibold text-navy-900">{x}</li>)}
          </ul>
        </Card>
        <Notice tone="warn" title="Check official advice first">Travel conditions and visa rules for religious destinations can change quickly. Check your government&apos;s travel advice and the official requirements before you book. We never guarantee visa or travel approval.</Notice>
      </Container>
      <FinalCta />
    </>
  );
}
