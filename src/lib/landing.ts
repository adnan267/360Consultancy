import { LANDING_PAGES, getLanding, type LandingPage } from "@/data/landing";
import { getRepo, isDatabaseConfigured } from "./repo";
import type { LandingPageRow } from "./types";

/**
 * Ad landing pages = built-in pages (data/landing.ts) + admin rows (landing_pages table).
 * A row overrides the built-in or country page with the same slug; an unpublished row hides it.
 * Falls back to the built-in pages when the database is not configured or unreachable.
 */
export const rowToLanding = (r: LandingPageRow): LandingPage => ({
  slug: r.slug, purpose: r.purpose, destination: r.destination ?? undefined, title: r.title, headline: r.headline,
  sub: r.sub, bullets: r.bullets, faqs: r.faqs, serviceSlug: r.service_slug ?? undefined,
});

export const landingToRow = (l: LandingPage, is_published = true): LandingPageRow => ({
  slug: l.slug, purpose: l.purpose, destination: l.destination ?? null, title: l.title, headline: l.headline,
  sub: l.sub, bullets: l.bullets, faqs: l.faqs, service_slug: l.serviceSlug ?? null, is_published,
});

/** Default copy for an auto-generated country landing page (/lp/<country>). */
export const countryLanding = (c: { slug: string; name: string }, faqs: { q: string; a: string }[]): LandingPage => ({
  slug: c.slug, purpose: "unsure", destination: c.slug, title: `${c.name} visa guidance`,
  headline: `${c.name} visa guidance — start with a clear plan`,
  sub: `Understand the general process for ${c.name}, with links to the official source, and get your documents ready.`,
  bullets: ["Study, work or visit guidance", "Document checklist for your case", "Consultant review of your file", `Official ${c.name} sources linked`],
  faqs,
});

export async function listLandingRows(): Promise<LandingPageRow[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    return await getRepo().listLandingPages();
  } catch (e) {
    console.error("[landing] rows fallback", e);
    return [];
  }
}

/** `null` = no landing page for this slug; `"hidden"` = an admin unpublished it (also hides the country page). */
export async function getPublicLanding(slug: string): Promise<LandingPage | "hidden" | null> {
  const row = (await listLandingRows()).find((r) => r.slug === slug);
  if (row) return row.is_published ? rowToLanding(row) : "hidden";
  return getLanding(slug) ?? null;
}

/** Every published service-style landing slug (built-in and admin-created). */
export async function listPublicLandingSlugs(): Promise<string[]> {
  const rows = await listLandingRows();
  const hidden = new Set(rows.filter((r) => !r.is_published).map((r) => r.slug));
  return [...new Set([...LANDING_PAGES.map((l) => l.slug), ...rows.filter((r) => r.is_published).map((r) => r.slug)])].filter((s) => !hidden.has(s));
}
