import type { Scholarship } from "@/lib/types";

/**
 * Scholarship records. ONLY records whose official page was opened and read
 * are included. `last_verified` is the date that page was read. Funding is
 * recorded exactly as the page describes it; deadlines are left null unless
 * the page states a current one.
 *
 * TO ADD MORE: open the provider's official page, copy only what it says,
 * and set last_verified. Candidates still to verify (official pages could
 * not be opened in this session): Chevening (UK), Fulbright Pakistan (US),
 * Australia Awards Pakistan, Chinese Government Scholarship (China),
 * Vanier CGS (Canada), Commonwealth Scholarships (UK).
 */
export const SEED_SCHOLARSHIPS: Scholarship[] = [
  {
    id: "seed-world-in-serbia",
    slug: "world-in-serbia",
    name: "World in Serbia",
    country_slug: "serbia",
    provider: "Government of the Republic of Serbia (Ministry of Education; Ministry of Foreign Affairs)",
    degree_levels: ["bachelor", "master", "doctoral"],
    funding_type: "full",
    funding_details:
      "The official page lists: free tuition, dormitory housing and meals, a monthly allowance, health insurance and an intensive Serbian-language course before enrolment.",
    deadline: null,
    deadline_note: "The Ministry of Education announces a competition each year; no dates were stated on the page. Check the official page for the current call.",
    eligibility_summary:
      "Per the official page: candidates from African, Asian, and Central and South American countries that are members or observer states of the Non-Aligned Movement, studying at state-founded universities. Confirm on the official page whether your country qualifies.",
    official_url: "https://welcometoserbia.gov.rs/scholarships",
    last_verified: "2026-10-22",
    is_published: true,
  },
  {
    id: "seed-mexico-excellence",
    slug: "mexican-government-scholarships-international-students",
    name: "Mexican Government Scholarships for International Students (Becas de Excelencia)",
    country_slug: "mexico",
    provider: "AMEXCID, on behalf of Mexico's Ministry of Foreign Affairs (SRE)",
    degree_levels: ["specialization", "master", "doctoral", "research", "academic mobility"],
    funding_type: "not_stated",
    funding_details: "The official page we read does not state what the scholarships cover. Check the current call.",
    deadline: null,
    deadline_note: "The page we read was last updated on 27 August 2020 and refers to a 2020 call. Confirm the current call and dates on the official site.",
    eligibility_summary:
      "Per the official page: foreign citizens from more than 180 countries under bilateral, multilateral or special agreements, studying at participating Mexican institutions in programmes registered with CONACYT as National Quality Graduate Programmes.",
    official_url: "https://consulmex.sre.gob.mx/hongkong/index.php/for-foreigners/studyinmexico/becas",
    last_verified: "2026-10-22",
    is_published: true,
  },
];

export const DEGREE_LEVEL_LABEL: Record<string, string> = {
  bachelor: "Bachelor's",
  master: "Master's",
  doctoral: "Doctoral",
  specialization: "Specialization",
  research: "Research",
  "academic mobility": "Academic mobility",
};
