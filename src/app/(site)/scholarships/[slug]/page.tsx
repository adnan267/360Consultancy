import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Flag } from "@/components/Flag";
import { ApplyCta, Fact, fmtDate, NoGuarantee, OfficialLink, VerifiedNote } from "@/components/study";
import { Badge, Container, PageHero } from "@/components/ui";
import { countryLabel, getStudyDestinations, getStudyScholarship, LEVEL_LABEL } from "@/lib/study";
import { FUNDING_LABEL } from "@/lib/types";

export const revalidate = 300;
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const s = await getStudyScholarship((await params).slug);
  if (!s) return {};
  return { title: `${s.name} — Eligibility, Coverage & Deadlines`, description: `${s.name}: sponsor, eligibility, coverage and official application page for Pakistani students.`, alternates: { canonical: `/scholarships/${s.slug}` } };
}

export default async function ScholarshipPage({ params }: { params: Promise<{ slug: string }> }) {
  const s = await getStudyScholarship((await params).slug);
  if (!s) notFound();
  const dests = await getStudyDestinations();
  const flag = dests.find((d) => d.slug === s.country_slug)?.flag;
  const closing = s.deadline ? `${fmtDate(s.deadline)}${s.deadline_note ? ` — ${s.deadline_note}` : ""}` : s.deadline_note;
  return (
    <>
      <PageHero eyebrow={countryLabel(dests, s.country_slug)} title={s.name} intro={`Sponsor: ${s.provider}`}>
        <div className="flex items-center gap-3">{flag && <Flag code={flag} label={s.country_slug} className="text-4xl" />}<Badge tone={s.funding_type === "full" || s.funding_type === "tuition_free" ? "green" : "gray"}>{FUNDING_LABEL[s.funding_type]}</Badge></div>
      </PageHero>
      <Container className="space-y-10 py-14">
        <dl className="grid gap-x-8 gap-y-5 rounded-2xl border border-line bg-white p-6 shadow-card sm:grid-cols-2">
          <Fact label="Country" value={countryLabel(dests, s.country_slug)} />
          <Fact label="Sponsoring organization" value={s.provider} />
          <Fact label="Eligible nationalities" value={s.eligible_nationalities} />
          <Fact label="Eligible degree levels" value={s.degree_levels.map((l) => LEVEL_LABEL[l] ?? l).join(", ")} />
          <Fact label="Eligible academic disciplines" value={s.disciplines} wide />
          <Fact label="Funding details (as the official source describes)" value={s.funding_type === "not_stated" ? "" : s.funding_details} wide />
          <Fact label="Tuition fee coverage" value={s.tuition_coverage} />
          <Fact label="Monthly stipend" value={s.stipend} />
          <Fact label="Accommodation" value={s.accommodation} />
          <Fact label="Airfare" value={s.airfare} />
          <Fact label="Medical insurance" value={s.insurance} />
          <Fact label="Eligibility requirements" value={s.last_verified ? s.eligibility_summary : ""} wide />
          <Fact label="Minimum academic qualifications" value={s.min_qualification} />
          <Fact label="Age requirements" value={s.age_requirement} />
          <Fact label="Language requirements" value={s.language_requirement} />
          <Fact label="Required documents" value={(s.required_documents ?? []).join("\n")} />
          <Fact label="Application opening" value={s.opens_note} wide />
          <Fact label="Application closing" value={closing} wide />
          <Fact label="Scholarship duration" value={s.duration} />
        </dl>
        <div className="flex flex-wrap items-center gap-6"><OfficialLink url={s.official_url}>Official scholarship page</OfficialLink><Link href="/scholarships" className="font-semibold text-navy-700 underline underline-offset-4">All scholarships</Link></div>
        <VerifiedNote date={s.last_verified} />
        <ApplyCta subject={s.name} />
        <NoGuarantee />
      </Container>
    </>
  );
}
