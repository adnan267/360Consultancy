import { Hero } from "@/components/Hero";
import { Wizard } from "@/components/Wizard";
import { Container } from "@/components/ui";
import { COUNTRY_CONTENT } from "@/data/countries";
import { leadsEnabled, siteUrl } from "@/lib/env";
import { ContactCta, DirectoryTeaser, SpiritualTeaser, PurposeCards, FaqSection, FeaturedCountries, FeesSection, FinalCta, OfficialResources, ProcessSection, ServicesSection, StudySection, ToolsTeaser, TrustSection, VisitSection, WorkSection } from "@/components/sections";
import { getDestinationCountries, getDirectoryCountries, getPublicScholarships, getPublicServices, getActiveQuestions } from "@/lib/catalog";
import { site } from "@/lib/site";

export const revalidate = 300;

export default async function HomePage() {
  const [services, countries, scholarships, evisa, visaFree] = await Promise.all([getPublicServices(), getDestinationCountries(), getPublicScholarships(), getDirectoryCountries("evisa"), getDirectoryCountries("visa-free")]);
  const questions = await getActiveQuestions();
  const org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: siteUrl(),
    logo: `${siteUrl()}/brand/logo-full.png`,
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(org).replace(/</g, "\\u003c") }} />
      <Hero />
      <PurposeCards />
      <section id="find-visa-options" aria-labelledby="fvo-title" className="bg-mist py-16 sm:py-20">
        <Container>
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-gold-600">Find visa options</p>
            <h2 id="fvo-title" className="mt-2 text-3xl font-extrabold text-navy-900 sm:text-4xl">Not sure which visa or destination fits you?</h2>
            <p className="mt-3 text-muted">Answer a few quick questions and see the guidance, services and official links that match your goal. It is not an eligibility decision.</p>
          </div>
          <Wizard
            leadsEnabled={leadsEnabled()}
            questions={questions.map((q) => ({ id: q.id, label: q.label, help: q.help, kind: q.kind, options: q.options, purpose: q.purpose, required: q.required }))}
            countries={countries.flatMap((c) => { const f = COUNTRY_CONTENT.find((x) => x.slug === c.slug)?.flag; return f ? [{ slug: c.slug, name: c.name, flag: f }] : []; })}
            services={services.map((x) => ({ slug: x.slug, title: x.title, summary: x.summary }))}
          />
        </Container>
      </section>
      <FeaturedCountries countries={countries} />
      <ProcessSection />
      <TrustSection />
      <StudySection scholarships={scholarships} />
      <WorkSection />
      <VisitSection countries={countries} />
      <ServicesSection services={services} />
      
      <DirectoryTeaser evisa={evisa} visaFree={visaFree} />
      <SpiritualTeaser />
      <FeesSection services={services} />
      <ToolsTeaser />
      <OfficialResources countries={countries} />
      <FaqSection />
      <ContactCta />
      <FinalCta />
    </>
  );
}
