import type { Metadata } from "next";
import Link from "next/link";
import { Flag } from "@/components/Flag";
import { FinalCta } from "@/components/sections";
import { ButtonLink, Card, Container, Notice, PageHero } from "@/components/ui";
import { whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Tour Packages",
  description: "Tour packages for Pakistani travellers: Dubai, Türkiye, Malaysia, Thailand, Azerbaijan, Georgia, Maldives, Sri Lanka and Nepal, with visa guidance and a written quote.",
  alternates: { canonical: "/tour-packages" },
};

const PACKAGES = [
  { name: "Dubai & UAE", flag: "ae", slug: "united-arab-emirates", best: "City breaks, family holidays and shopping", highlights: ["Burj Khalifa and Dubai Mall", "Desert safari", "Abu Dhabi: Sheikh Zayed Grand Mosque"] },
  { name: "Türkiye", flag: "tr", slug: "turkey", best: "History, culture and scenery", highlights: ["Istanbul: Hagia Sophia and the Bosphorus", "Cappadocia", "Pamukkale"] },
  { name: "Malaysia", flag: "my", slug: "malaysia", best: "Families, honeymoons and first international trip", highlights: ["Kuala Lumpur: Petronas Towers", "Langkawi", "Genting Highlands"] },
  { name: "Thailand", flag: "th", slug: "thailand", best: "Beaches, islands and city life", highlights: ["Bangkok", "Phuket and Krabi", "Pattaya"] },
  { name: "Azerbaijan", flag: "az", slug: "azerbaijan", best: "Short, affordable-feeling city and mountain trips", highlights: ["Baku Old City and Flame Towers", "Gabala", "Gobustan"] },
  { name: "Georgia", flag: "ge", slug: "georgia", best: "Mountains, old towns and wine country", highlights: ["Tbilisi", "Kazbegi", "Batumi on the Black Sea"] },
  { name: "Maldives", flag: "mv", slug: "maldives", best: "Honeymoons and island resorts", highlights: ["Resort islands", "Snorkelling and diving", "Sunset cruises"] },
  { name: "Sri Lanka", flag: "lk", slug: "sri-lanka", best: "Nature, tea country and beaches", highlights: ["Kandy and Nuwara Eliya", "Sigiriya", "Southern beaches"] },
  { name: "Nepal", flag: "np", slug: "nepal", best: "Mountains, culture and adventure", highlights: ["Kathmandu valley", "Pokhara", "Himalayan views"] },
];

const INCLUDES = ["Visa or entry-requirement guidance and document checklist", "Hotel options that match your budget", "Flight options and travel dates", "Airport transfers and local transport", "Sightseeing and activity ideas", "Travel insurance guidance"];

export default function TourPackagesPage() {
  return (
    <>
      <PageHero eyebrow="Tour packages" title="Tour packages built around you" intro="Tell us where you want to go, your dates and budget. We prepare your visa guidance and send a clear written quote.">
        <div className="flex flex-wrap gap-3"><ButtonLink href="/wizard?purpose=visit">Check my visa options</ButtonLink><ButtonLink href="/contact" variant="outline-light">Contact us</ButtonLink></div>
      </PageHero>
      <Container className="space-y-14 py-14">
        <section aria-labelledby="dest">
          <h2 id="dest" className="text-2xl font-extrabold text-navy-900">Popular destinations</h2>
          <p className="mt-2 max-w-2xl text-muted">Every trip is customised. Prices depend on season, hotel, group size and dates, so we quote after you tell us what you need.</p>
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PACKAGES.map((p) => {
              const wa = whatsappLink(`Hello 360 Consultancy, I would like a quote for a ${p.name} tour package.`);
              return (
                <li key={p.name}>
                  <Card className="flex h-full flex-col">
                    <div className="flex items-center gap-3"><Flag code={p.flag} label={p.name} className="text-3xl" /><h3 className="text-xl font-bold text-navy-900">{p.name}</h3></div>
                    <p className="mt-2 text-sm font-semibold text-gold-700">{p.best}</p>
                    <ul className="mt-3 flex-1 list-disc space-y-1 pl-5 text-sm text-muted">{p.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {wa && <ButtonLink href={wa} className="min-h-10 px-4 py-2 text-sm">Get a quote</ButtonLink>}
                      <ButtonLink href={`/countries/${p.slug}`} variant="secondary" className="min-h-10 px-4 py-2 text-sm">Entry rules</ButtonLink>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
          <p className="mt-6 text-sm text-muted">Looking for religious travel? See <Link href="/spiritual-tours" className="font-semibold underline">holy and spiritual tours</Link>. Or browse all <Link href="/destinations" className="font-semibold underline">e-visa and visa-free destinations</Link>.</p>
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
