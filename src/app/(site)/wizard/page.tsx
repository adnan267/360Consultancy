import type { Metadata } from "next";
import { Wizard } from "@/components/Wizard";
import { Container, PageHero } from "@/components/ui";
import { COUNTRY_CONTENT } from "@/data/countries";
import { getDestinationCountries, getPublicServices } from "@/lib/catalog";
import { getRepo } from "@/lib/repo";
import { leadsEnabled } from "@/lib/env";

export const metadata: Metadata = { title: "Find Your Visa Options", description: "Answer a few questions to see relevant guidance, services and resources. Not an eligibility decision.", alternates: { canonical: "/wizard" } };
export const dynamic = "force-dynamic";

export default async function WizardPage() {
  const [countries, services] = await Promise.all([getDestinationCountries(), getPublicServices()]);
  const questions = await getRepo().listWizardQuestions({ activeOnly: true }).catch(() => []);
  return (
    <>
      <PageHero eyebrow="Visa wizard" title="Find your visa options" intro="A few quick questions to point you to the right guidance. It is not an official eligibility check — final decisions remain with the relevant authorities." />
      <Container className="py-12">
        <Wizard
          questions={questions.map((q) => ({ id: q.id, label: q.label, help: q.help, kind: q.kind, options: q.options, purpose: q.purpose, required: q.required }))}
          leadsEnabled={leadsEnabled()}
          countries={countries.flatMap((c) => { const f = COUNTRY_CONTENT.find((x) => x.slug === c.slug)?.flag; return f ? [{ slug: c.slug, name: c.name, flag: f }] : []; })}
          services={services.map((s) => ({ slug: s.slug, title: s.title, summary: s.summary }))}
        />
      </Container>
    </>
  );
}
