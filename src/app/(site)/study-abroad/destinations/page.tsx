import type { Metadata } from "next";
import Link from "next/link";
import { Flag } from "@/components/Flag";
import { FinalCta } from "@/components/sections";
import { NoGuarantee } from "@/components/study";
import { Container, PageHero } from "@/components/ui";
import { getStudyDestinations } from "@/lib/study";
import { STUDY_REGIONS } from "@/lib/types";

export const metadata: Metadata = { title: "Study Destinations for Pakistani Students", description: "Study abroad destinations in Asia, the Middle East, Europe, North America and Oceania — official links, universities and scholarships for Pakistani students.", alternates: { canonical: "/study-abroad/destinations" } };
export const revalidate = 300;

export default async function DestinationsPage() {
  const all = await getStudyDestinations();
  return (
    <>
      <PageHero eyebrow="Study abroad" title="Study destinations" intro="Pick a country to see its universities, scholarships, requirements and official links. Each page shows only what an official source confirms." />
      <Container className="space-y-12 py-14">
        {STUDY_REGIONS.map((r) => {
          const items = all.filter((d) => d.region === r);
          if (!items.length) return null;
          return (
            <section key={r} aria-labelledby={r.replace(/\W/g, "")}>
              <h2 id={r.replace(/\W/g, "")} className="text-2xl font-extrabold text-navy-900">{r}</h2>
              <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((d) => (
                <li key={d.slug}><Link href={`/study-abroad/destinations/${d.slug}`} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-card transition hover:border-gold-500">
                  {d.flag && <Flag code={d.flag} label={d.name} className="text-3xl" />}<span className="font-bold text-navy-900">{d.name}</span>
                </Link></li>
              ))}</ul>
            </section>
          );
        })}
        <NoGuarantee />
      </Container>
      <FinalCta />
    </>
  );
}
