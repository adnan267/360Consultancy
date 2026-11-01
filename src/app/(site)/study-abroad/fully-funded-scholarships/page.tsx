import type { Metadata } from "next";
import Link from "next/link";
import { FinalCta } from "@/components/sections";
import { NoGuarantee } from "@/components/study";
import { Badge, Card, Container, Notice, PageHero } from "@/components/ui";
import { countryLabel, getStudyDestinations, getStudyScholarships } from "@/lib/study";

export const metadata: Metadata = { title: "Fully Funded Scholarships for Pakistani Students", description: "Scholarships that the provider itself describes as fully funded, with the benefits listed on the official page.", alternates: { canonical: "/study-abroad/fully-funded-scholarships" } };
export const revalidate = 300;

export default async function FullyFundedPage() {
  const [dests, all] = await Promise.all([getStudyDestinations(), getStudyScholarships()]);
  const full = all.filter((s) => s.funding_type === "full");
  const pending = all.filter((s) => s.funding_type === "not_stated");
  return (
    <>
      <PageHero eyebrow="Scholarships" title="Fully funded scholarships" intro="We list a scholarship as fully funded only when its official page describes the benefits. We never assume it, and we never imply a university offers one to every student." />
      <Container className="space-y-12 py-14">
        <section aria-labelledby="ff"><h2 id="ff" className="text-2xl font-extrabold text-navy-900">Described as fully funded by the provider</h2>
          {full.length ? <ul className="mt-5 grid gap-5 md:grid-cols-2">{full.map((s) => (
            <li key={s.slug}><Card className="h-full"><Badge tone="green">Fully funded (per provider)</Badge><h3 className="mt-2 text-lg font-bold text-navy-900"><Link href={`/scholarships/${s.slug}`} className="hover:underline">{s.name}</Link></h3><p className="text-sm text-muted">{countryLabel(dests, s.country_slug)} · {s.provider}</p><p className="mt-2 text-sm text-muted">{s.funding_details}</p><p className="mt-3"><Link href={`/scholarships/${s.slug}`} className="text-sm font-bold text-navy-700 hover:underline">Eligibility, coverage and deadlines →</Link></p></Card></li>
          ))}</ul> : <p className="mt-4 text-sm text-muted">No scholarship is classified as fully funded yet.</p>}
        </section>
        <section aria-labelledby="pn"><h2 id="pn" className="text-2xl font-extrabold text-navy-900">Still being checked against official sources</h2>
          <p className="mt-2 max-w-3xl text-muted">These programmes are listed, but we have not yet confirmed what they cover from the official page. Open the record and the official link to read the current terms.</p>
          <ul className="mt-4 flex flex-wrap gap-2">{pending.map((s) => <li key={s.slug}><Link href={`/scholarships/${s.slug}`} className="inline-block rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-navy-800 hover:border-gold-500">{s.name}</Link></li>)}</ul>
        </section>
        <Notice tone="info" title="How to use this page">Funding differs by country, university, degree and intake. Read the official call, check the deadline, and prepare documents early. We can review your profile and documents — see <Link href="/book" className="font-semibold underline">book a consultation</Link>.</Notice>
        <NoGuarantee />
      </Container>
      <FinalCta />
    </>
  );
}
