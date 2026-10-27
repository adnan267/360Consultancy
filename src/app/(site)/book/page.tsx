import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ButtonLink, Card, Container, Notice, PageHero } from "@/components/ui";
import { getClientSession } from "@/lib/client-auth";
import { portalEnabled, servicesEnabled } from "@/lib/env";
import { site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = { title: "Book a Consultation", description: "Register, pay the starting fee and start your case with 360 Consultancy.", alternates: { canonical: "/book" } };
export const dynamic = "force-dynamic";

export default async function BookPage() {
  const session = await getClientSession();
  if (session && portalEnabled()) redirect("/portal");
  const open = servicesEnabled() && portalEnabled();
  const wa = whatsappLink();

  return (
    <>
      <PageHero eyebrow="Book a consultation" title="Register, pay, then we start" intro="Every step of our service begins only after its fee is paid online. Create your free client account to get started." />
      <Container className="grid gap-10 py-14 lg:grid-cols-[1.6fr_1fr]">
        <div>
          {open ? (
            <Card className="p-6 sm:p-8">
              <h2 className="text-2xl font-extrabold text-navy-900">How it works</h2>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-muted">
                <li>Create your client account (free).</li>
                <li>Choose your destination and purpose, and start a case.</li>
                <li>Pay the starting fee online. Your case opens as soon as the payment is confirmed.</li>
                <li>Each later step (document review, submission) is also paid before it begins.</li>
              </ol>
              <div className="mt-6 flex flex-wrap gap-3">
                <ButtonLink href="/portal/register">Create account</ButtonLink>
                <ButtonLink href="/portal/login" variant="secondary">I already have an account</ButtonLink>
              </div>
            </Card>
          ) : (
            <Card className="p-8">
              <h2 className="text-2xl font-extrabold text-navy-900">Bookings are not open yet</h2>
              <p className="mt-3 text-muted">We are completing our final preparations. Please check back soon.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {wa && <ButtonLink href={wa} variant="secondary">Message us on WhatsApp</ButtonLink>}
                {site.contact.email && <ButtonLink href={`mailto:${site.contact.email}`} variant="secondary">Email us</ButtonLink>}
                <ButtonLink href="/services" variant="ghost">Explore services</ButtonLink>
              </div>
            </Card>
          )}
        </div>
        <aside className="space-y-4">
          <Notice tone="info" title="Pay before each step">No work starts and no appointment is booked until the fee for that step is paid and confirmed.</Notice>
          <Notice tone="warn" title="No guarantees">We provide guidance only. Final visa decisions remain with the relevant authorities.</Notice>
        </aside>
      </Container>
    </>
  );
}
