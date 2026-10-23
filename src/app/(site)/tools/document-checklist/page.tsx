import type { Metadata } from "next";
import { ChecklistTool } from "@/components/ChecklistTool";
import { Container, PageHero } from "@/components/ui";
import { COUNTRY_CONTENT } from "@/data/countries";
import { getDestinationCountries } from "@/lib/catalog";

export const metadata: Metadata = { title: "Document Checklist Tool", description: "An indicative document checklist by purpose, with the official link for your destination.", alternates: { canonical: "/tools/document-checklist" } };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ purpose?: string }> }) {
  const sp = await searchParams;
  const countries = await getDestinationCountries();
  const purpose = sp.purpose === "study" || sp.purpose === "work" || sp.purpose === "visit" ? sp.purpose : undefined;
  const list = countries.flatMap((c) => { const x = COUNTRY_CONTENT.find((k) => k.slug === c.slug); return x ? [{ slug: c.slug, name: c.name, flag: x.flag, link: x.officialLinks[0] ? { label: x.officialLinks[0].label, url: x.officialLinks[0].url } : null }] : []; });
  return (
    <>
      <PageHero eyebrow="Tool" title="Document checklist" intro="Tick off what you have, print it, and always confirm against the official list." />
      <Container className="py-12"><ChecklistTool countries={list} initialPurpose={purpose} /></Container>
    </>
  );
}
