import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Flag } from "@/components/Flag";
import { ApplyCta, Fact, NoGuarantee, OfficialLink, VerifiedNote } from "@/components/study";
import { Container, PageHero } from "@/components/ui";
import { getStudyDestination, getStudyScholarships, getUniversity, LEVEL_LABEL } from "@/lib/study";

export const revalidate = 300;
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const u = await getUniversity((await params).slug);
  if (!u) return {};
  return { title: `${u.name} — Admission & Scholarships for Pakistani Students`, description: `${u.name}${u.city ? `, ${u.city}` : ""}: official website, admission information and scholarship guidance for Pakistani students.`, alternates: { canonical: `/study-abroad/universities/${u.slug}` } };
}

export default async function UniversityPage({ params }: { params: Promise<{ slug: string }> }) {
  const u = await getUniversity((await params).slug);
  if (!u) notFound();
  const [d, schol] = await Promise.all([getStudyDestination(u.country_slug), getStudyScholarships({ country: u.country_slug })]);
  return (
    <>
      <PageHero eyebrow={[u.city, d?.name].filter(Boolean).join(", ")} title={u.name} intro={u.overview || `${u.name} is a university in ${[u.city, d?.name].filter(Boolean).join(", ")}. Check its official website for programmes, fees and admission rules.`}>
        {d?.flag && <Flag code={d.flag} label={d.name} className="text-4xl" />}
      </PageHero>
      <Container className="space-y-10 py-14">
        <dl className="grid gap-x-8 gap-y-5 rounded-2xl border border-line bg-white p-6 shadow-card sm:grid-cols-2">
          <Fact label="World ranking" value={u.ranking ? `${u.ranking} (${u.ranking_source}, ${u.ranking_year})` : ""} />
          <Fact label="Degree levels" value={u.degree_levels.map((l) => LEVEL_LABEL[l] ?? l).join(", ")} />
          <Fact label="Study programs" value={u.programs.join(", ")} wide />
          <Fact label="Tuition fee range" value={u.tuition_range} />
          <Fact label="English language requirements" value={u.english_requirements} />
          <Fact label="Admission requirements" value={u.admission_requirements} wide />
          <Fact label="Application opens" value={u.apply_opens} />
          <Fact label="Application closes" value={u.apply_closes} />
        </dl>
        <section aria-labelledby="sch">
          <h2 id="sch" className="text-2xl font-extrabold text-navy-900">Scholarships at this university</h2>
          <dl className="mt-4 grid gap-5 rounded-2xl border border-line bg-white p-6 shadow-card sm:grid-cols-2">
            <Fact label="Available scholarships (by degree and intake)" value={u.scholarships_note} wide />
            <Fact label="Scholarship coverage" value={u.scholarship_coverage} wide />
          </dl>
          <p className="mt-3 text-sm text-muted">Scholarship availability differs by degree and intake. A university being listed here does not mean it offers a fully funded scholarship to every Pakistani student.</p>
          {schol.length > 0 && <p className="mt-2 text-sm text-muted">Government scholarships for {d?.name}: {schol.map((s, i) => <span key={s.slug}>{i > 0 && ", "}<Link href={`/scholarships/${s.slug}`} className="font-semibold text-navy-700 underline">{s.name}</Link></span>)}.</p>}
        </section>
        <section className="flex flex-wrap gap-6" aria-label="Official links">
          {u.official_url && <OfficialLink url={u.official_url}>Official website</OfficialLink>}
          {u.admission_portal_url ? <OfficialLink url={u.admission_portal_url}>Official admission portal</OfficialLink> : <span className="text-sm italic text-muted">Admission portal: find it on the official website.</span>}
          {d && <Link href={`/study-abroad/destinations/${d.slug}`} className="font-semibold text-navy-700 underline underline-offset-4">Study in {d.name}</Link>}
        </section>
        <VerifiedNote date={u.last_verified} />
        <ApplyCta subject={u.name} />
        <NoGuarantee />
      </Container>
    </>
  );
}
