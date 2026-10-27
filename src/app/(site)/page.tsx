import { Hero } from "@/components/Hero";
import { ContactCta, DirectoryTeaser, FindOptionsBand, SpiritualTeaser, PurposeCards, FaqSection, FeaturedCountries, FeesSection, FinalCta, OfficialResources, ProcessSection, ServicesSection, StudySection, ToolsTeaser, TrustSection, VisitSection, WorkSection } from "@/components/sections";
import { getDestinationCountries, getDirectoryCountries, getPublicScholarships, getPublicServices } from "@/lib/catalog";
import { siteUrl } from "@/lib/env";
import { site } from "@/lib/site";

export const revalidate = 300;

export default async function HomePage() {
  const [services, countries, scholarships, evisa, visaFree] = await Promise.all([getPublicServices(), getDestinationCountries(), getPublicScholarships(), getDirectoryCountries("evisa"), getDirectoryCountries("visa-free")]);
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
      <FindOptionsBand />
      <PurposeCards />
      <FeaturedCountries countries={countries} />
      <ProcessSection />
      <TrustSection />
      <StudySection scholarships={scholarships} />
      <WorkSection />
      <VisitSection countries={countries} />
      <ServicesSection services={services} />
      <FindOptionsBand />
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
