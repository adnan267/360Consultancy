import { SEED_COUNTRIES, SEED_SERVICES } from "@/data/seed";
import { getRepo, isDatabaseConfigured } from "./repo";
import { SEED_SCHOLARSHIPS } from "@/data/scholarships";
import type { Country, Scholarship, ScholarshipFilter, Service } from "./types";

/**
 * Public catalogue reads. Falls back to the built-in seed when the database is
 * not configured or unreachable, so the marketing site never hard-fails.
 * (Booking prices are NEVER taken from here — see lib/bookings.ts.)
 */
export async function getPublicServices(): Promise<Service[]> {
  if (isDatabaseConfigured()) {
    try {
      return await getRepo().listServices({ activeOnly: true });
    } catch (e) {
      console.error("[catalog] services fallback", e);
    }
  }
  return SEED_SERVICES.filter((s) => s.is_active).sort((a, b) => a.sort_order - b.sort_order);
}

export async function getPublicCountries(): Promise<Country[]> {
  if (isDatabaseConfigured()) {
    try {
      return await getRepo().listCountries({ activeOnly: true });
    } catch (e) {
      console.error("[catalog] countries fallback", e);
    }
  }
  return SEED_COUNTRIES.filter((c) => c.is_active).sort((a, b) => a.sort_order - b.sort_order);
}

export async function getDestinationCountries(): Promise<Country[]> {
  return (await getPublicCountries()).filter((c) => c.slug !== "other");
}

/** Published scholarships only. Falls back to built-in verified seed records. */
export async function getPublicScholarships(filter: Omit<ScholarshipFilter, "publishedOnly"> = {}): Promise<Scholarship[]> {
  if (isDatabaseConfigured()) {
    try {
      return await getRepo().listScholarships({ ...filter, publishedOnly: true });
    } catch (e) {
      console.error("[catalog] scholarships fallback", e);
    }
  }
  const q = filter.q?.toLowerCase();
  return SEED_SCHOLARSHIPS.filter((s) => s.is_published)
    .filter((s) => !filter.country || s.country_slug === filter.country)
    .filter((s) => !filter.level || s.degree_levels.includes(filter.level))
    .filter((s) => !filter.funding || s.funding_type === filter.funding)
    .filter((s) => !q || [s.name, s.provider, s.eligibility_summary].some((v) => v.toLowerCase().includes(q)));
}
