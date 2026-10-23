import type { Metadata } from "next";
import { FinalCta } from "@/components/sections";
import { Card, Container, Notice, PageHero } from "@/components/ui";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "About Us", description: "How 360 Consultancy works and what we promise.", alternates: { canonical: "/about" } };

const values = [
  ["Clarity", "We explain the process in plain language so you can make informed decisions."],
  ["Honesty", "We never promise an outcome. Visa decisions belong to the authorities."],
  ["Official sources", "We point you to the official government sources and tell you when our information was last checked."],
  ["Respect for your data", "We collect only what we need and never ask for passport details in our booking form."],
];

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="About us" title="Guidance that starts with honesty" intro="360 Consultancy helps people understand their visa options, organise their documents and prepare for their next step." />
      <Container className="py-16">
        <div className="grid gap-6 md:grid-cols-2">
          {values.map(([t, d]) => (<Card key={t}><h2 className="text-xl font-bold text-navy-900">{t}</h2><p className="mt-2 text-muted">{d}</p></Card>))}
        </div>
        <div className="mt-12 max-w-3xl space-y-5">
          <h2 className="text-2xl font-extrabold text-navy-900">What we do — and what we don&apos;t</h2>
          <p className="leading-relaxed text-muted">We provide consultations and document guidance. We are not an embassy, consulate or government body, we do not make or influence visa decisions, and we do not guarantee any visa, job, work permit or immigration outcome.</p>
          {site.registration ? (
            <p className="text-sm text-muted">Business registration: {site.registration}</p>
          ) : (
            <Notice tone="info">Business registration and team details will be published here once verified.</Notice>
          )}
        </div>
      </Container>
      <FinalCta />
    </>
  );
}
