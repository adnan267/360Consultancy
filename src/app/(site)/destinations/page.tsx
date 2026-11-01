import type { Metadata } from "next";
import Link from "next/link";
import { Flag } from "@/components/Flag";
import { FinalCta } from "@/components/sections";
import { ButtonLink, Container, Notice, PageHero } from "@/components/ui";
import { getCountryContent } from "@/data/countries";
import { ENTRY_AS_OF, ENTRY_SOURCES, ETA_LIST, EVISA_LIST, ON_ARRIVAL_LIST, VISA_FREE_LIST, type Entry } from "@/data/pakistan-entry";
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

function EntryList({ items }: { items: Entry[] }) {
  return (
    <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((e) => {
        const inner = (<><Flag code={e.flag} label={e.name} className="text-2xl" /><span className="min-w-0"><span className="block font-semibold text-navy-900">{e.name}</span>{e.stay && <span className="block text-xs text-muted">{e.stay}</span>}</span></>);
        return (
          <li key={e.name + e.flag}>
            {e.slug && getCountryContent(e.slug)
              ? <Link href={`/countries/${e.slug}`} className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 transition hover:border-gold-500">{inner}<span className="ml-auto text-xs font-bold text-navy-700">Guide →</span></Link>
              : <div className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3">{inner}</div>}
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
          <h2 id="evisa" className="text-2xl font-extrabold text-navy-900">Popular e-visa destinations with our guides</h2>
          <p className="mt-2 text-muted">You apply on the government portal before you travel.</p>
          <Grid countries={evisa} />
        </section>
        <section aria-labelledby="vf">
          <h2 id="vf" className="text-2xl font-extrabold text-navy-900">Popular visa-free and on-arrival destinations with our guides</h2>
          <p className="mt-2 text-muted">Reported to allow entry without a prior visa, or with an online travel authorisation, under conditions.</p>
          <Grid countries={visaFree} />
        </section>
        <nav aria-label="Lists" className="flex flex-wrap gap-2 text-sm font-semibold">
          {[["#list-free", "Visa-free"], ["#list-voa", "Visa on arrival"], ["#list-eta", "eTA / travel authorisation"], ["#list-evisa", "E-visa"]].map(([h, l]) => <a key={h} href={h} className="rounded-full border border-line bg-white px-4 py-2 text-navy-800 hover:border-gold-500">{l}</a>)}
        </nav>
        <section aria-labelledby="list-free" id="list-free">
          <h2 id="list-free" className="text-2xl font-extrabold text-navy-900">Visa-free countries ({VISA_FREE_LIST.length})</h2>
          <p className="mt-2 text-muted">Reported to allow Pakistani passport holders to enter without a visa for the stay shown, under conditions.</p>
          <EntryList items={VISA_FREE_LIST} />
        </section>
        <section aria-labelledby="list-voa" id="list-voa">
          <h2 id="list-voa" className="text-2xl font-extrabold text-navy-900">Visa on arrival ({ON_ARRIVAL_LIST.length})</h2>
          <p className="mt-2 text-muted">You get the visa at the airport or border, or in some cases apply online first.</p>
          <EntryList items={ON_ARRIVAL_LIST} />
        </section>
        <section aria-labelledby="list-eta" id="list-eta">
          <h2 id="list-eta" className="text-2xl font-extrabold text-navy-900">Electronic travel authorisation ({ETA_LIST.length})</h2>
          <p className="mt-2 text-muted">A quick online authorisation before you fly.</p>
          <EntryList items={ETA_LIST} />
        </section>
        <section aria-labelledby="list-evisa" id="list-evisa">
          <h2 id="list-evisa" className="text-2xl font-extrabold text-navy-900">E-visa countries ({EVISA_LIST.length})</h2>
          <p className="mt-2 text-muted">You apply online on the official portal before you travel. Some also have conditions, for example holding another valid visa.</p>
          <EntryList items={EVISA_LIST} />
        </section>
        <p className="text-sm text-muted">Lists compiled from public sources (as of {ENTRY_AS_OF}): {ENTRY_SOURCES.map((x, i) => <span key={x.url}>{i > 0 && "; "}<a href={x.url} target="_blank" rel="noopener noreferrer" className="underline">{x.label}</a></span>)}. We re-check them regularly, but rules change, so confirm on the official government site or with the embassy before you book. We can help you check.</p>
        <p className="text-sm text-muted">Need study or work routes instead? See <Link href="/countries" className="font-semibold underline">study, work and visit destinations</Link>.</p>
      </Container>
      <FinalCta />
    </>
  );
}
