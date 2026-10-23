import type { Metadata } from "next";
import Link from "next/link";
import { Card, Container, PageHero } from "@/components/ui";

export const metadata: Metadata = { title: "Tools", description: "Free planning tools: visa wizard, document checklist and country comparison.", alternates: { canonical: "/tools" } };

const tools = [
  { href: "/wizard", t: "Visa options wizard", d: "A few questions to point you to relevant guidance and services." },
  { href: "/tools/document-checklist", t: "Document checklist", d: "An indicative checklist by purpose, with the official link for your destination." },
  { href: "/compare", t: "Country comparison", d: "Compare official authorities, links and what we have verified." },
  { href: "/scholarships", t: "Scholarship finder", d: "Search scholarship records checked against official pages." },
];

export default function ToolsPage() {
  return (
    <>
      <PageHero eyebrow="Tools" title="Free planning tools" intro="Helpful starting points. None of them is an official decision." />
      <Container className="py-14">
        <ul className="grid gap-5 sm:grid-cols-2">{tools.map((t) => <li key={t.href}><Link href={t.href}><Card className="h-full transition hover:-translate-y-1 hover:shadow-lift"><h2 className="text-xl font-bold text-navy-900">{t.t}</h2><p className="mt-2 text-muted">{t.d}</p><span className="mt-4 inline-block font-bold text-navy-700">Open →</span></Card></Link></li>)}</ul>
      </Container>
    </>
  );
}
