import type { Metadata } from "next";
import Link from "next/link";
import { FinalCta } from "@/components/sections";
import { ButtonLink, Card, Container, Notice, PageHero } from "@/components/ui";
import { getPublicCountries } from "@/lib/catalog";
import { getCountryContent } from "@/data/countries";

export const metadata: Metadata = {
  title: "Study Abroad Guidance",
  description: "Step-by-step guidance for Pakistani students: choosing a destination, preparing admissions documents, scholarships and understanding the student-visa process.",
  alternates: { canonical: "/study-abroad" },
};

const steps = [
  ["Choose your destination and course", "Compare countries, study levels and budgets. Our destination pages link to official sources."],
  ["Check admission requirements", "Each university sets its own requirements. We help you understand them and organise what you need."],
  ["Explore scholarships", "Use our scholarship finder to see records we have reviewed, and always confirm details with the funder."],
  ["Prepare your documents", "Academic records, language-test results, financial evidence and statements. We review documents you prepare and give written feedback."],
  ["Understand the student-visa process", "Visa rules change and decisions are made only by the relevant authority. We point you to official guidance."],
];

export const revalidate = 300;

export default async function StudyAbroadPage() {
  const countries = (await getPublicCountries()).filter((c) => getCountryContent(c.slug));
  return (
    <>
      <PageHero eyebrow="Study abroad" title="Plan your studies abroad with clear, honest guidance" intro="From choosing a country to preparing your documents — we explain each step and never promise an outcome.">
        <div className="flex flex-wrap gap-3"><ButtonLink href="/wizard?purpose=study">Start your assessment</ButtonLink><ButtonLink href="/scholarships" variant="outline-light">Find scholarships</ButtonLink></div>
      </PageHero>
      <Container className="space-y-14 py-16">
        <section aria-labelledby="steps"><h2 id="steps" className="text-2xl font-extrabold text-navy-900">Your path in five steps</h2>
          <ol className="mt-6 grid gap-5 md:grid-cols-2">{steps.map(([t, d], i) => (<li key={t}><Card className="h-full"><p className="text-sm font-bold text-gold-700">Step {i + 1}</p><h3 className="mt-1 text-lg font-bold text-navy-900">{t}</h3><p className="mt-2 text-muted">{d}</p></Card></li>))}</ol>
        </section>
        <section aria-labelledby="dest"><h2 id="dest" className="text-2xl font-extrabold text-navy-900">Destinations</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{countries.map((c) => (<li key={c.slug}><Link href={`/countries/${c.slug}`} className="block rounded-xl border border-line bg-white p-4 font-semibold text-navy-800 shadow-card transition hover:border-gold-500">{c.name}</Link></li>))}</ul>
        </section>
        <Notice tone="warn" title="What we do not do">We are an independent consultancy, not a university, embassy or government body. We cannot guarantee admission, a scholarship or a visa. University and visa fees are paid by you directly to those organisations.</Notice>
        <p className="text-sm text-muted">See <Link href="/pricing" className="font-semibold underline">pricing</Link> or <Link href="/how-it-works" className="font-semibold underline">how it works</Link>.</p>
      </Container>
      <FinalCta />
    </>
  );
}
