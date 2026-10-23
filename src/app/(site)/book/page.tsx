import type { Metadata } from "next";
import { BookingForm } from "@/components/BookingForm";
import { ButtonLink, Card, Container, Notice, PageHero } from "@/components/ui";
import { getPublicCountries, getPublicServices } from "@/lib/catalog";
import { servicesEnabled } from "@/lib/env";
import { site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = { title: "Book a Consultation", description: "Request a consultation with 360 Consultancy.", alternates: { canonical: "/book" } };
// Reads the feature flag and query string on each request.
export const dynamic = "force-dynamic";

export default async function BookPage({ searchParams }: { searchParams: Promise<{ service?: string; country?: string }> }) {
  const sp = await searchParams;
  const enabled = servicesEnabled();
  const [services, countries] = await Promise.all([getPublicServices(), getPublicCountries()]);
  const wa = whatsappLink();

  return (
    <>
      <PageHero eyebrow="Book a consultation" title="Tell us about your goal" intro="Submit a request. It becomes a confirmed appointment only after we accept it and verify your payment." />
      <Container className="grid gap-10 py-14 lg:grid-cols-[1.6fr_1fr]">
        <div>
          {enabled ? (
            <Card className="p-6 sm:p-8">
              <BookingForm
                services={services.map((s) => ({ slug: s.slug, title: s.title, fee_pkr: s.fee_pkr, fee_is_starting_price: s.fee_is_starting_price, duration_minutes: s.duration_minutes }))}
                countries={countries.map((c) => ({ slug: c.slug, name: c.name }))}
                defaultService={sp.service}
                defaultCountry={sp.country}
              />
            </Card>
          ) : (
            <Card className="p-8">
              <h2 className="text-2xl font-extrabold text-navy-900">Bookings are not open yet</h2>
              <p className="mt-3 text-muted">We are completing our final preparations and are not yet accepting bookings or payments. Please check back soon.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {wa && <ButtonLink href={wa} variant="secondary">Message us on WhatsApp</ButtonLink>}
                {site.contact.email && <ButtonLink href={`mailto:${site.contact.email}`} variant="secondary">Email us</ButtonLink>}
                <ButtonLink href="/services" variant="ghost">Explore services</ButtonLink>
              </div>
            </Card>
          )}
        </div>
        <aside className="space-y-4">
          <Notice tone="info" title="What we ask for">Only the details in this form. We do not ask for passport numbers or identity-document uploads here.</Notice>
          <Notice tone="warn" title="No guarantees">We provide guidance only. Final visa decisions remain with the relevant authorities.</Notice>
        </aside>
      </Container>
    </>
  );
}
