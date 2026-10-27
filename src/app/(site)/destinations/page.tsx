import type { Metadata } from "next";
import Link from "next/link";
import { Flag } from "@/components/Flag";
import { FinalCta } from "@/components/sections";
import { ButtonLink, Container, Notice, PageHero } from "@/components/ui";
import { getCountryContent } from "@/data/countries";
import { getDirectoryCountries } from "@/lib/catalog";
import type { Country } from "@/lib/types";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "E-visa & Visa-free Destinations",
  description: "Destinations reported to offer e-visas, visa-free, on-arrival or electronic-authorisation entry to Pakistani passport holders, with official links.",
  alternates: { canonical: "/destinations" },
};

function Grid({ countries }: { countries: Country[] }) {
  return (
    <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {countries.map((c) => {
        const x = getCountryContent(c.slug);
        return (
          <li key={c.id}>
            <Link href={`/countries/${c.slug}`} className="flex h-full flex-col rounded-2xl border border-line bg-white p-6 shadow-card transition hover:-translate-y-1 hover:border-gold-500 hover:shadow-lift">
              {x && <Flag code={x.flag} label={c.name} className="text-4xl" />}
              <h3 className="mt-4 text-lg font-bold text-navy-900">{c.name}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{x?.authority}</p>
              <span className="mt-4 text-sm font-bold text-navy-700">Official link &amp; guidance →</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default async function DestinationsPage() {
  const [evisa, visaFree] = await Promise.all([getDirectoryCountries("evisa"), getDirectoryCountries("visa-free")]);
  return (
    <>
      <PageHero eyebrow="Destinations" title="E-visa and visa-free destinations" intro="Easier-entry destinations for Pakistani passport holders, each with a link to the official source.">
        <div className="flex flex-wrap gap-3"><ButtonLink href="/wizard?purpose=visit">Find your visa options</ButtonLink><ButtonLink href="/book" variant="outline-light">Book a consultation</ButtonLink></div>
      </PageHero>
      <Container className="space-y-14 py-14">
        <Notice tone="warn" title="Confirm before you travel">Entry rules for Pakistani passport holders change often and depend on your situation (for example other visas held, purpose and stay length). The groupings below are indicative. We do not state fees, stay limits or eligibility here; always confirm the current rule on the official site linked on each page.</Notice>
        <section aria-labelledby="evisa">
          <h2 id="evisa" className="text-2xl font-extrabold text-navy-900">Apply online (e-visa)</h2>
          <p className="mt-2 text-muted">You apply on the government portal before you travel.</p>
          <Grid countries={evisa} />
        </section>
        <section aria-labelledby="vf">
          <h2 id="vf" className="text-2xl font-extrabold text-navy-900">Visa-free, on arrival or electronic authorisation</h2>
          <p className="mt-2 text-muted">Reported to allow entry without a prior visa, or with an online travel authorisation, under conditions.</p>
          <Grid countries={visaFree} />
        </section>
        <p className="text-sm text-muted">Need study or work routes instead? See <Link href="/countries" className="font-semibold underline">study, work and visit destinations</Link>.</p>
      </Container>
      <FinalCta />
    </>
  );
}
