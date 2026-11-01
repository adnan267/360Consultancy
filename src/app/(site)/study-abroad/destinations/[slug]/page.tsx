import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Flag } from "@/components/Flag";
import { ApplyCta, Fact, NoGuarantee, OfficialLink, VerifiedNote } from "@/components/study";
import { Badge, Card, Container, PageHero } from "@/components/ui";
import { FUNDING_LABEL } from "@/lib/types";
import { getStudyDestination, getStudyScholarships, getUniversities } from "@/lib/study";

export const revalidate = 300;
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const d = await getStudyDestination((await params).slug);
  if (!d) return {};
  return { title: `Study in ${d.name} — Universities & Scholarships for Pakistani Students`, description: `Universities, scholarships, admission and student-visa information for studying in ${d.name}, with official links.`, alternates: { canonical: `/study-abroad/destinations/${d.slug}` } };
}

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const d = await getStudyDestination((await params).slug);
  if (!d) notFound();
  const [unis, schol] = await Promise.all([getUniversities({ country: d.slug }), getStudyScholarships({ country: d.slug })]);
  return (
    <>
      <PageHero eyebrow={d.region} title={`Study in ${d.name}`} intro={d.overview || `Information for Pakistani students who want to study in ${d.name}. We add details only from official sources — use the official links below in the meantime.`}>
        {d.flag && <Flag code={d.flag} label={d.name} className="text-5xl" />}
      </PageHero>
      <Container className="space-y-12 py-14">
        <section aria-labelledby="req">
          <h2 id="req" className="text-2xl font-extrabold text-navy-900">Requirements and costs</h2>
          <dl className="mt-5 grid gap-x-8 gap-y-5 rounded-2xl border border-line bg-white p-6 shadow-card sm:grid-cols-2">
            <Fact label="Degree programs" value={d.degree_programs} />
            <Fact label="Tuition fees" value={d.tuition_info} />
            <Fact label="Living cost estimate" value={d.living_cost} />
            <Fact label="Language requirements" value={d.language_requirements} />
            <Fact label="IELTS / TOEFL" value={d.english_tests} />
            <Fact label="Admission requirements" value={d.admission_requirements} />
            <Fact label="Student visa requirements" value={d.visa_requirements} />
            <Fact label="Work opportunities" value={d.work_options} />
          </dl>
          <div className="mt-3"><VerifiedNote date={d.last_verified} /></div>
        </section>

        <section aria-labelledby="unis">
          <div className="flex flex-wrap items-end justify-between gap-3"><h2 id="unis" className="text-2xl font-extrabold text-navy-900">Popular universities</h2><Link href={`/study-abroad/universities?country=${d.slug}`} className="text-sm font-semibold text-navy-700 underline">All universities in {d.name}</Link></div>
          {unis.length ? <ul className="mt-5 grid gap-4 sm:grid-cols-2">{unis.map((u) => (<li key={u.slug}><Link href={`/study-abroad/universities/${u.slug}`} className="block rounded-2xl border border-line bg-white p-4 shadow-card transition hover:border-gold-500"><span className="font-bold text-navy-900">{u.name}</span><span className="block text-sm text-muted">{u.city}</span></Link></li>))}</ul>
            : <p className="mt-4 text-sm text-muted">Universities for this country are being added. Ask us for a shortlist.</p>}
        </section>

        <section aria-labelledby="sch">
          <h2 id="sch" className="text-2xl font-extrabold text-navy-900">Scholarships for Pakistani students</h2>
          {schol.length ? <ul className="mt-5 space-y-3">{schol.map((s) => (<li key={s.slug}><Card className="flex flex-wrap items-center justify-between gap-3 p-4"><Link href={`/scholarships/${s.slug}`} className="font-bold text-navy-900 hover:underline">{s.name}</Link><Badge tone={s.funding_type === "full" ? "green" : "gray"}>{FUNDING_LABEL[s.funding_type]}</Badge></Card></li>))}</ul>
            : <p className="mt-4 text-sm text-muted">No scholarship record for this country yet. <Link href="/scholarships" className="font-semibold underline">Browse all scholarships</Link>.</p>}
        </section>

        {d.official_links.length > 0 && (
          <section aria-labelledby="off"><h2 id="off" className="text-2xl font-extrabold text-navy-900">Official links</h2>
            <ul className="mt-4 space-y-2">{d.official_links.map((l) => <li key={l.url}><OfficialLink url={l.url}>{l.label}</OfficialLink></li>)}</ul>
            <p className="mt-2 text-sm text-muted">Rules, fees and dates change. Confirm on the official source.</p>
          </section>
        )}
        <ApplyCta subject={`study in ${d.name}`} />
        <NoGuarantee />
      </Container>
    </>
  );
}
