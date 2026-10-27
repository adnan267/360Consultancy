import type { Metadata } from "next";
import { FeeLabel, FinalCta } from "@/components/sections";
import { ButtonLink, Card, Container, Notice, PageHero } from "@/components/ui";
import { getPublicServices } from "@/lib/catalog";
import { servicesEnabled } from "@/lib/env";
import { formatPkr } from "@/lib/pricing";
import { INTAKE_SERVICE_SLUG, REVIEW_SERVICE_SLUG } from "@/lib/cases";

export const revalidate = 300;
export const metadata: Metadata = { title: "Pricing", description: "Our consultancy fees, what each includes, and which costs are paid to third parties.", alternates: { canonical: "/pricing" } };

export default async function PricingPage() {
  const services = await getPublicServices();
  const enabled = servicesEnabled();
  const intake = services.find((s) => s.slug === INTAKE_SERVICE_SLUG);
  const review = services.find((s) => s.slug === REVIEW_SERVICE_SLUG);
  return (
    <>
      <PageHero eyebrow="Pricing" title="Clear fees, stated up front" intro="You always see our fee, what it covers and what it does not before you pay." />
      <Container className="space-y-12 py-16">
        {!enabled && <Notice tone="info" title="Bookings are not open yet">Fees will be shown here when our services open for booking.</Notice>}

        {enabled && services.length > 0 && (
          <section aria-labelledby="svc-fees">
            <h2 id="svc-fees" className="text-2xl font-extrabold text-navy-900">Consultancy services</h2>
            <ul className="mt-6 grid gap-6 md:grid-cols-2">{services.map((s) => (
              <li key={s.id}><Card className="flex h-full flex-col"><h3 className="text-xl font-bold text-navy-900">{s.title}</h3><p className="mt-2 flex-1 text-muted">{s.summary}</p><div className="mt-4 flex items-center justify-between gap-3"><FeeLabel service={s} /><ButtonLink href={`/book?service=${s.slug}`} variant="secondary">Book</ButtonLink></div></Card></li>
            ))}</ul>
          </section>
        )}

        <section aria-labelledby="stages" className="max-w-3xl">
          <h2 id="stages" className="text-2xl font-extrabold text-navy-900">How fees work for a full application case</h2>
          <ol className="mt-5 space-y-4 text-muted">
            <li><strong className="text-navy-900">1. Starting fee{enabled && intake ? ` — ${formatPkr(intake.fee_pkr)}` : ""}.</strong> Opens secure document upload.</li>
            <li><strong className="text-navy-900">2. Document review fee{enabled && review ? ` — ${formatPkr(review.fee_pkr)}` : ""}.</strong> Our team reviews your documents and sends a written report.</li>
            <li><strong className="text-navy-900">3. Submission fee — quoted after review.</strong> If you want us to submit your file, we send a written quote with the exact scope. You pay it only after you accept; nothing is charged automatically.</li>
          </ol>
        </section>

        <Notice tone="warn" title="Fees we do not charge or control">Government, embassy, biometric, courier and university application fees are set by those organisations and paid by you directly to them. They are never part of our fee. Paying us does not guarantee a visa, admission or scholarship.</Notice>
        <p className="text-sm text-muted">Each step is paid online before it begins (cryptocurrency such as USDT via our payment partner) and is confirmed automatically once the payment completes. See our <a className="font-semibold underline" href="/refund-policy">Refund &amp; Cancellation Policy</a>.</p>
      </Container>
      <FinalCta />
    </>
  );
}
