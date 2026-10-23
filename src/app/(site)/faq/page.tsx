import type { Metadata } from "next";
import { FAQS } from "@/data/faq";
import { FaqList, FinalCta } from "@/components/sections";
import { Container, PageHero } from "@/components/ui";

export const metadata: Metadata = { title: "FAQs", description: "Straight answers about our visa guidance services, fees and payment.", alternates: { canonical: "/faq" } };

export default function FaqPage() {
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <PageHero eyebrow="FAQs" title="Frequently asked questions" intro="Including the things we cannot do." />
      <Container className="max-w-3xl py-16"><FaqList /></Container>
      <FinalCta />
    </>
  );
}
