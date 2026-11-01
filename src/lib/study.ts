import { STUDY_DESTINATIONS_SEED, STUDY_SCHOLARSHIPS_SEED, UNIVERSITIES_SEED } from "@/data/study";
import { getRepo, isDatabaseConfigured } from "@/lib/repo";
import type { Scholarship, ScholarshipFilter, StudyDestination, University, UniversityFilter } from "./types";

export const LEVEL_LABEL: Record<string, string> = { bachelor: "Bachelor's", master: "Master's", doctoral: "Doctoral (PhD)", research: "Research", specialization: "Specialization", "academic mobility": "Academic mobility" };
export const LEVELS = ["bachelor", "master", "doctoral", "research"] as const;

let seeded = false;
/** Fills empty study tables with the starter records (idempotent). Never overwrites admin edits. */
export async function ensureStudySeed(): Promise<void> {
  if (seeded || !isDatabaseConfigured()) return;
  try {
    const repo = getRepo();
    if ((await repo.listStudyDestinations()).length === 0) for (const d of STUDY_DESTINATIONS_SEED) await repo.saveStudyDestination(d);
    if ((await repo.listUniversities()).length === 0) for (const u of UNIVERSITIES_SEED) await repo.saveUniversity(u);
    const have = new Set((await repo.listScholarships({})).map((s) => s.slug));
    if (!STUDY_SCHOLARSHIPS_SEED.some((s) => have.has(s.slug))) for (const s of STUDY_SCHOLARSHIPS_SEED) await repo.saveScholarship(s);
    seeded = true;
  } catch (e) {
    console.error("[study] seed", e);
  }
}

export async function getStudyDestinations(): Promise<StudyDestination[]> {
  if (isDatabaseConfigured()) {
    try {
      await ensureStudySeed();
      const rows = await getRepo().listStudyDestinations({ publishedOnly: true });
      if (rows.length) return rows;
    } catch (e) { console.error("[study] destinations fallback", e); }
  }
  return STUDY_DESTINATIONS_SEED.filter((d) => d.is_published);
}
export async function getStudyDestination(slug: string) {
  return (await getStudyDestinations()).find((d) => d.slug === slug) ?? null;
}

export async function getUniversities(f: Omit<UniversityFilter, "publishedOnly"> = {}): Promise<University[]> {
  if (isDatabaseConfigured()) {
    try {
      await ensureStudySeed();
      const rows = await getRepo().listUniversities({ ...f, publishedOnly: true });
      if (rows.length || f.q || f.country || f.level) return rows;
    } catch (e) { console.error("[study] universities fallback", e); }
  }
  const q = f.q?.toLowerCase();
  return UNIVERSITIES_SEED.filter((u) => u.is_published && (!f.country || u.country_slug === f.country) && (!f.level || u.degree_levels.includes(f.level)) && (!q || u.name.toLowerCase().includes(q) || u.city.toLowerCase().includes(q)));
}
export async function getUniversity(slug: string) {
  return (await getUniversities()).find((u) => u.slug === slug) ?? null;
}

export async function getStudyScholarships(f: Omit<ScholarshipFilter, "publishedOnly"> = {}): Promise<Scholarship[]> {
  if (isDatabaseConfigured()) {
    try {
      await ensureStudySeed();
      return await getRepo().listScholarships({ ...f, publishedOnly: true });
    } catch (e) { console.error("[study] scholarships fallback", e); }
  }
  const q = f.q?.toLowerCase();
  return STUDY_SCHOLARSHIPS_SEED.filter((s) => (!f.country || s.country_slug === f.country) && (!f.level || s.degree_levels.includes(f.level)) && (!f.funding || s.funding_type === f.funding) && (!q || [s.name, s.provider].some((v) => v.toLowerCase().includes(q))));
}
export async function getStudyScholarship(slug: string) {
  return (await getStudyScholarships()).find((s) => s.slug === slug) ?? null;
}

/** Country display name for a study slug (destinations first, then a readable fallback). */
export function countryLabel(dests: StudyDestination[], slug: string) {
  return dests.find((d) => d.slug === slug)?.name ?? (slug === "europe" ? "Europe (multi-country)" : slug === "pakistan" ? "Pakistan" : slug.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()));
}
