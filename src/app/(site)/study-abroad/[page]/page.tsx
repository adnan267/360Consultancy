import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FinalCta } from "@/components/sections";
import { ApplyCta, NoGuarantee } from "@/components/study";
import { Card, Container, PageHero } from "@/components/ui";

type Info = { title: string; short: string; intro: string; steps: [string, string][]; links?: [string, string][] };
const PAGES: Record<string, Info> = {
  "university-admissions": {
    title: "University admissions", short: "How university admission works and how we help you prepare a strong application.",
    intro: "Every university sets its own admission rules, documents, fees and deadlines. We help you read them correctly, choose realistic options and prepare a complete application — the admission decision is always made by the university.",
    steps: [["Shortlist", "We compare countries, universities, programmes and budget with your academic profile."], ["Check the official requirements", "We read the university’s official admission page with you — documents, language tests, fees and dates."], ["Prepare documents", "Transcripts, certificates, passport, language-test result, statement of purpose and references, organised and reviewed."], ["Apply and track", "You submit through the university’s official portal; we guide each field and follow your deadlines."], ["After the offer", "We explain the offer conditions, deposit and enrolment steps, and how they connect to the student visa."]],
    links: [["Find your university", "/study-abroad/universities"], ["Study destinations", "/study-abroad/destinations"]],
  },
  "student-visa-assistance": {
    title: "Student visa assistance", short: "Guidance for the student-visa file, based on each country’s official rules.",
    intro: "Student-visa rules differ by country and change often. We help you understand the official requirements, organise and review your documents and prepare your file. The visa decision is made only by the embassy or immigration authority.",
    steps: [["Read the official checklist", "We point you to the country’s official visa page and explain it in plain language."], ["Document review", "We review your documents and give written feedback on gaps and inconsistencies."], ["Financial and academic evidence", "We help you present the evidence the authority asks for. We never create or alter documents."], ["File preparation", "We prepare your file and application steps so nothing is missed."], ["Interview and appointment guidance", "General preparation for appointments and interviews where the country requires them."]],
    links: [["Student visa services", "/wizard?purpose=study"], ["Pricing", "/pricing"]],
  },
  "application-process": {
    title: "Application process", short: "The full study-abroad process from choosing a country to arriving on campus.",
    intro: "A clear order of steps helps you avoid missed deadlines. Timelines vary by country and intake, so begin well before the application deadline.",
    steps: [["1. Free assessment", "Tell us your level, budget, field and timeline."], ["2. Choose country and university", "We shortlist options and show their official links."], ["3. Scholarships", "We check which scholarships fit your profile and read their official calls."], ["4. Documents", "Collect, translate if required, and review all documents."], ["5. Apply", "Submit to the university and/or scholarship portal."], ["6. Offer and acceptance", "Review conditions and accept before the deadline."], ["7. Student visa", "Prepare and submit the visa file."], ["8. Travel and arrival", "Plan accommodation, insurance and travel."]],
    links: [["Start the free assessment", "/wizard?purpose=study"], ["How we work", "/how-it-works"]],
  },
  consultation: {
    title: "Study abroad consultation", short: "Book a one-to-one study-abroad consultation with 360 Consultancy.",
    intro: "Talk to us about countries, universities, scholarships and your documents. Bring your latest transcript, passport details and any test results. We give honest guidance and never promise admission, funding or a visa.",
    steps: [["Share your profile", "Education, grades, field of interest, budget and target intake."], ["We suggest options", "Countries and universities that match, with official links."], ["Scholarship check", "Which scholarships to consider and when their calls usually open (confirmed on the official site)."], ["Your plan", "A step-by-step plan with documents and timelines."]],
    links: [["Book a consultation", "/book"], ["Contact us", "/contact"]],
  },
};
const SLUG = { "university-admissions": 1, "student-visa-assistance": 1, "application-process": 1, consultation: 1 };

export function generateStaticParams() { return Object.keys(SLUG).map((page) => ({ page })); }
export const dynamicParams = false;
export async function generateMetadata({ params }: { params: Promise<{ page: string }> }): Promise<Metadata> {
  const p = PAGES[(await params).page];
  return p ? { title: p.title, description: p.short, alternates: { canonical: `/study-abroad/${(await params).page}` } } : {};
}

export default async function InfoPage({ params }: { params: Promise<{ page: string }> }) {
  const key = (await params).page;
  const p = PAGES[key];
  if (!p) notFound();
  return (
    <>
      <PageHero eyebrow="Study abroad" title={p.title} intro={p.intro} />
      <Container className="space-y-12 py-14">
        <ol className="grid gap-5 md:grid-cols-2">{p.steps.map(([t, d]) => <li key={t}><Card className="h-full"><h2 className="text-lg font-bold text-navy-900">{t}</h2><p className="mt-1 text-muted">{d}</p></Card></li>)}</ol>
        {p.links && <p className="flex flex-wrap gap-6">{p.links.map(([l, h]) => <Link key={h} href={h} className="font-semibold text-navy-700 underline underline-offset-4">{l}</Link>)}</p>}
        <ApplyCta subject={p.title} />
        <NoGuarantee />
      </Container>
      <FinalCta />
    </>
  );
}
