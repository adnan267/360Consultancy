import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Notice } from "@/components/ui";
import { LandingEditor } from "@/components/AdminClient";
import { getCountryContent } from "@/data/countries";
import { getLanding } from "@/data/landing";
import { getSession } from "@/lib/auth";
import { getDestinationCountries, getPublicServices } from "@/lib/catalog";
import { countryLanding, landingToRow } from "@/lib/landing";
import { getRepo, isDatabaseConfigured } from "@/lib/repo";
import { can } from "@/lib/status";
import type { LandingPageRow } from "@/lib/types";
import { landingSlugSchema } from "@/lib/validation";
import { DESTINATIONS } from "@/lib/wizard";

export const metadata = { title: "Edit landing page" };
export const dynamic = "force-dynamic";

export default async function EditLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!can(session.role, "content:manage")) notFound();
  if (!isDatabaseConfigured()) return <Notice tone="warn">Database not configured.</Notice>;
  const { slug } = await params;
  if (!landingSlugSchema.safeParse(slug).success) notFound();

  const [rows, countries, services] = await Promise.all([getRepo().listLandingPages(), getDestinationCountries(), getPublicServices()]);
  const row = rows.find((r) => r.slug === slug);
  const builtIn = getLanding(slug);
  const country = countries.find((c) => c.slug === slug);
  const countryDefault = country ? countryLanding(country, [...(getCountryContent(slug)?.faqs ?? [])]) : undefined;
  const fallback = builtIn ?? countryDefault;
  const page: LandingPageRow = row ?? (fallback ? landingToRow(fallback) : { slug, purpose: "unsure", destination: null, title: "", headline: "", sub: "", bullets: [], faqs: [], service_slug: null, is_published: true });

  const destinations = DESTINATIONS.filter((d) => d !== "undecided").map((d) => ({ slug: d, name: countries.find((c) => c.slug === d)?.name ?? d }));

  return (
    <div className="max-w-3xl space-y-6">
      <p className="text-sm"><Link href="/admin/landing-pages" className="font-semibold text-navy-700 hover:underline">← All landing pages</Link></p>
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-navy-900">{row || fallback ? "Edit landing page" : "New landing page"}</h1>
        <p className="text-sm text-muted">URL: <a href={`/lp/${slug}`} target="_blank" rel="noreferrer" className="font-semibold text-navy-700 hover:underline">/lp/{slug}</a>{fallback && !row && " · showing the default content — save to make your own version."}</p>
      </div>
      <LandingEditor page={page} hasDefault={!!fallback} saved={!!row} destinations={destinations} services={services.map((x) => ({ slug: x.slug, title: x.title }))} />
    </div>
  );
}
