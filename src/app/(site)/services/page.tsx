import type { Metadata } from "next";
import { IncludedList, FeeLabel, FinalCta } from "@/components/sections";
import { ButtonLink, Card, Container, Notice, PageHero } from "@/components/ui";
import { getPublicServices } from "@/lib/catalog";
import { servicesEnabled } from "@/lib/env";
import { Clock } from "lucide-react";

export const revalidate = 300;
export const metadata: Metadata = { title: "Visa Services", description: "Clearly scoped visa guidance, document review and application assistance — with inclusions, exclusions and fees stated up front.", alternates: { canonical: "/services" } };

export default async function ServicesPage() {
  const services = await getPublicServices();
  const enabled = servicesEnabled();
  return (
    <>
      <PageHero eyebrow="Visa services" title="Guidance you can understand, scoped clearly" intro="Each service lists exactly what is included and what is not, so there are no surprises." />
      <Container className="py-16">
        {!enabled && (
          <div className="mb-10">
            <Notice tone="info" title="Bookings are not open yet">Fees will be shown here when our services open for booking.</Notice>
          </div>
        )}
        <div className="space-y-8">
          {services.map((s) => (
            <Card key={s.id} id={s.slug} className="scroll-mt-28 p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <h2 className="text-2xl font-extrabold text-navy-900">{s.title}</h2>
                  <p className="mt-3 leading-relaxed text-muted">{s.description}</p>
                  <p className="mt-3 text-sm"><span className="font-semibold text-navy-800">Scope: </span><span className="text-muted">{s.scope}</span></p>
                </div>
                <div className="text-right">
                  {enabled && <FeeLabel service={s} />}
                  {s.duration_minutes && <p className="mt-1 flex items-center justify-end gap-1.5 text-sm font-semibold text-navy-800"><Clock className="size-4 text-gold-600" />{s.duration_minutes} minutes</p>}
                </div>
              </div>
              <div className="mt-8 grid gap-8 sm:grid-cols-2">
                <IncludedList title="Included" items={s.inclusions} tone="yes" />
                <IncludedList title="Not included" items={s.exclusions} tone="no" />
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
                <p className="max-w-xl text-xs leading-relaxed text-muted">{s.refund_terms} Government and embassy fees are separate. Our fee does not guarantee approval.</p>
                <ButtonLink href={`/book?service=${s.slug}`}>Book this service</ButtonLink>
              </div>
            </Card>
          ))}
        </div>
        <div className="mt-12"><Notice tone="warn" title="Government and embassy fees">These are set by the relevant authority, change over time, and are paid by you directly to that authority. They are never part of our fee.</Notice></div>
      </Container>
      <FinalCta />
    </>
  );
}
