import type { Metadata } from "next";
import Link from "next/link";
import { PackageCard } from "@/components/PackageCard";
import { FinalCta } from "@/components/sections";
import { ButtonLink, Card, Container, Notice, PageHero } from "@/components/ui";
import { getPackages } from "@/lib/packages";

export const metadata: Metadata = {
  title: "Tour Packages",
  description: "Tour packages for Pakistani travellers: Dubai, Türkiye, Malaysia, Thailand, Azerbaijan, Georgia, Maldives, Sri Lanka and Nepal, with visa guidance and a written quote.",
  alternates: { canonical: "/tour-packages" },
};

const INCLUDES = ["Visa or entry-requirement guidance and document checklist", "Hotel options that match your budget", "Flight options and travel dates", "Airport transfers and local transport", "Sightseeing and activity ideas", "Travel insurance guidance"];

export const revalidate = 300;

export default async function TourPackagesPage() {
  const packages = await getPackages({ category: "tour" });
  return (
    <>
      <PageHero eyebrow="Tour packages" title="Tour packages built around you" intro="Tell us where you want to go, your dates and budget. We prepare your visa guidance and send a clear written quote.">
        <div className="flex flex-wrap gap-3"><ButtonLink href="/wizard?purpose=visit">Check my visa options</ButtonLink><ButtonLink href="/contact" variant="outline-light">Contact us</ButtonLink></div>
      </PageHero>
      <Container className="space-y-14 py-14">
        <section aria-labelledby="dest">
          <h2 id="dest" className="text-2xl font-extrabold text-navy-900">Popular destinations</h2>
          <p className="mt-2 max-w-2xl text-muted">Every trip is customised. Where a price is shown it is the starting price per person; otherwise we quote after you tell us your dates and needs.</p>
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((p) => <li key={p.slug}><PackageCard p={p} entryHref={p.country_slug ? `/countries/${p.country_slug}` : undefined} /></li>)}
          </ul>
          <p className="mt-6 text-sm text-muted">Looking for religious travel? See <Link href="/religious-tours" className="font-semibold underline">religious and spiritual tours</Link>. Or browse all <Link href="/destinations" className="font-semibold underline">e-visa and visa-free destinations</Link>.</p>
        </section>

        <section aria-labelledby="inc">
          <h2 id="inc" className="text-2xl font-extrabold text-navy-900">What we can arrange</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">{INCLUDES.map((i) => <li key={i} className="rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-navy-900">{i}</li>)}</ul>
          <p className="mt-3 text-sm text-muted">Exactly what is included, and the price, is written in your quote before you pay anything.</p>
        </section>

        <section aria-labelledby="how">
          <h2 id="how" className="text-2xl font-extrabold text-navy-900">How it works</h2>
          <ol className="mt-5 grid gap-4 md:grid-cols-4">
            {[["1. Tell us", "Destination, dates, number of travellers and budget."], ["2. Check entry rules", "We confirm whether you need a visa, e-visa or nothing, using official sources."], ["3. Get your quote", "A written quote with what is included and what is not."], ["4. Prepare and travel", "We guide your documents and plan the trip with you."]].map(([t, d]) => <li key={t}><Card className="h-full"><p className="font-bold text-navy-900">{t}</p><p className="mt-2 text-sm text-muted">{d}</p></Card></li>)}
          </ol>
        </section>

        <Notice tone="warn" title="Visa decisions are not ours">We guide your documents and application, but every visa or entry decision is made by the destination&apos;s authorities. We never guarantee approval. Government and embassy fees are paid by you directly to them.</Notice>
      </Container>
      <FinalCta />
    </>
  );
}
