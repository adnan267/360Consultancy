import type { Metadata } from "next";
import Link from "next/link";
import { FinalCta } from "@/components/sections";
import { NoGuarantee } from "@/components/study";
import { Card, Container, Notice, PageHero } from "@/components/ui";
import { getStudyDestinations, getStudyScholarships, getUniversities } from "@/lib/study";

export const metadata: Metadata = { title: "Tuition-Free Universities & Programs", description: "Universities and programmes whose official sources state that tuition is free, and how to check before you apply.", alternates: { canonical: "/study-abroad/tuition-free-universities" } };
export const revalidate = 300;

export default async function TuitionFreePage() {
  const [dests, unis, schol] = await Promise.all([getStudyDestinations(), getUniversities(), getStudyScholarships()]);
  const free = unis.filter((u) => u.tuition_free_note.trim());
  const freeSch = schol.filter((s) => s.funding_type === "tuition_free");
  const name = (slug: string) => dests.find((d) => d.slug === slug)?.name ?? slug;
  return (
    <>
      <PageHero eyebrow="Study abroad" title="Tuition-free universities and programs" intro="“Tuition-free” does not mean “cost-free”: living costs, insurance, and administrative or semester fees may still apply. We list a university here only when its official source says so." />
      <Container className="space-y-12 py-14">
        <section aria-labelledby="l"><h2 id="l" className="text-2xl font-extrabold text-navy-900">Confirmed from official sources</h2>
          {free.length || freeSch.length ? (
            <ul className="mt-5 grid gap-4 md:grid-cols-2">
              {free.map((u) => <li key={u.slug}><Card className="h-full"><h3 className="font-bold text-navy-900"><Link href={`/study-abroad/universities/${u.slug}`} className="hover:underline">{u.name}</Link></h3><p className="text-sm text-muted">{u.city}, {name(u.country_slug)}</p><p className="mt-2 text-sm text-muted">{u.tuition_free_note}</p></Card></li>)}
              {freeSch.map((s) => <li key={s.slug}><Card className="h-full"><h3 className="font-bold text-navy-900"><Link href={`/scholarships/${s.slug}`} className="hover:underline">{s.name}</Link></h3><p className="mt-2 text-sm text-muted">{s.tuition_coverage || s.funding_details}</p></Card></li>)}
            </ul>
          ) : <Card className="mt-5"><p className="font-bold text-navy-900">We are adding these from official sources.</p><p className="mt-1 text-sm text-muted">We do not list a university as tuition-free until its official page or the country’s official education portal states it. Meanwhile, use the destination pages’ official links, or ask us to check a specific university for you.</p></Card>}
        </section>
        <section aria-labelledby="h"><h2 id="h" className="text-2xl font-extrabold text-navy-900">How to check a “tuition-free” claim</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">{[
            "Find the statement on the university’s own site or the national education portal.",
            "Check whether it applies to your degree level, programme language and nationality.",
            "Ask about semester contributions, administrative and registration fees.",
            "Budget for living costs, health insurance and visa requirements separately.",
            "Compare the intake dates and the application deadline early.",
            "Be careful with agents or sites that promise ‘free’ admission — verify on the official site.",
          ].map((x) => <li key={x} className="rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-navy-900">{x}</li>)}</ul>
        </section>
        <Notice tone="info" title="Explore">See <Link href="/study-abroad/destinations" className="font-semibold underline">study destinations</Link>, <Link href="/study-abroad/universities" className="font-semibold underline">universities</Link> and <Link href="/study-abroad/fully-funded-scholarships" className="font-semibold underline">fully funded scholarships</Link>.</Notice>
        <NoGuarantee />
      </Container>
      <FinalCta />
    </>
  );
}
