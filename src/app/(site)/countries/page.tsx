import type { Metadata } from "next";
import Link from "next/link";
import { FinalCta } from "@/components/sections";
import { Container, PageHero } from "@/components/ui";
import { getDestinationCountries } from "@/lib/catalog";
import { getCountryContent } from "@/data/countries";
import { Flag } from "@/components/Flag";

export const revalidate = 300;
export const metadata: Metadata = { title: "Countries & Destinations", description: "General visa guidance and official source links for popular destinations.", alternates: { canonical: "/countries" } };

export default async function CountriesPage() {
  const countries = await getDestinationCountries();
  return (
    <>
      <PageHero eyebrow="Destinations" title="Choose your destination" intro="Each page gives general guidance and links to the official government sources — always confirm current rules there." />
      <Container className="py-16">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {countries.map((c) => {
            const content = getCountryContent(c.slug);
            return (
              <li key={c.id}>
                <Link href={`/countries/${c.slug}`} className="flex h-full flex-col rounded-2xl border border-line bg-white p-6 shadow-card transition hover:-translate-y-1 hover:border-gold-500 hover:shadow-lift">
                  {content && <Flag code={content.flag} label={c.name} className="text-4xl" />}
                  <h2 className="mt-4 text-lg font-bold text-navy-900">{c.name}</h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{content?.categories.join(" · ")}</p>
                  <span className="mt-4 text-sm font-bold text-navy-700">View guidance →</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="mt-10 text-center text-sm text-muted">Looking for easier-entry options? See <Link href="/destinations" className="font-semibold underline">e-visa and visa-free destinations</Link>.</p>
      </Container>
      <FinalCta />
    </>
  );
}
