/**
 * Country information content (editable here; reviewed periodically).
 *
 * RULES: no visa rules, fees, processing times or eligibility criteria are
 * stated unless they appear in `facts` WITH the official source page they
 * were read from. `lastVerified` is null until a human has read the official
 * sources — pages show a "pending verification" notice while it is null.
 * Each link records whether it was actually opened (`checkedOn`).
 */
export interface OfficialLink {
  label: string;
  url: string;
  /** ISO date this page was actually opened and read; absent = not yet checked. */
  checkedOn?: string;
}
export interface VerifiedFact {
  text: string;
  sourceLabel: string;
  sourceUrl: string;
}
export interface CountryContent {
  slug: string;
  /** ISO 3166-1 alpha-2, lower-case, for flag-icons */
  flag: string;
  authority: string;
  intro: string;
  categories: string[];
  officialLinks: OfficialLink[];
  facts: VerifiedFact[];
  lastVerified: string | null; // ISO date
  faqs: { q: string; a: string }[];
  /** Set for the e-visa / visa-free directory countries. Unset = core study/work/visit destination. */
  entry?: "evisa" | "visa-free";
}

const GENERIC_CATEGORIES = ["Visit / tourism", "Study", "Work"];
const COMMON_FAQ = (name: string) => [
  { q: `Can you guarantee a visa for ${name}?`, a: "No. Visa decisions are made only by the relevant authority. We provide guidance, not outcomes." },
  { q: "Where do I find the current fees and processing times?", a: "On the official website linked on this page. They change often, so we do not restate them here." },
  { q: "Are your fees the same as government fees?", a: "No. Our consultancy fee is separate. Government, embassy and biometric fees are paid directly to the authority." },
];

export const COUNTRY_CONTENT: CountryContent[] = [
  {
    slug: "united-states",
    flag: "us",
    authority: "U.S. Department of State (visas) and U.S. embassies/consulates",
    intro: "US visas are handled through the Department of State and US embassies and consulates. Requirements depend on the visa category and your circumstances.",
    categories: GENERIC_CATEGORIES,
    officialLinks: [{ label: "U.S. Department of State – Visas", url: "https://travel.state.gov/content/travel/en/us-visas.html" }],
    facts: [],
    lastVerified: null,
    faqs: COMMON_FAQ("the United States"),
  },
  {
    slug: "united-kingdom",
    flag: "gb",
    authority: "UK Visas and Immigration (UKVI)",
    intro: "UK visas are managed by UK Visas and Immigration. Requirements vary by route; always confirm details on the official GOV.UK pages.",
    categories: GENERIC_CATEGORIES,
    officialLinks: [{ label: "GOV.UK – Visas and immigration", url: "https://www.gov.uk/browse/visas-immigration" }],
    facts: [],
    lastVerified: null,
    faqs: COMMON_FAQ("the United Kingdom"),
  },
  {
    slug: "australia",
    flag: "au",
    authority: "Department of Home Affairs",
    intro: "Australian visas are managed by the Department of Home Affairs. Requirements depend on the specific visa subclass and your circumstances.",
    categories: GENERIC_CATEGORIES,
    officialLinks: [{ label: "Department of Home Affairs – Immigration", url: "https://immi.homeaffairs.gov.au" }],
    facts: [],
    lastVerified: null,
    faqs: COMMON_FAQ("Australia"),
  },
  {
    slug: "canada",
    flag: "ca",
    authority: "Immigration, Refugees and Citizenship Canada (IRCC)",
    intro: "Canada's immigration system is managed by IRCC. Requirements depend on the visa category, your circumstances and current official rules.",
    categories: GENERIC_CATEGORIES,
    officialLinks: [{ label: "IRCC – Immigration and citizenship", url: "https://www.canada.ca/en/immigration-refugees-citizenship.html" }],
    facts: [],
    lastVerified: null,
    faqs: COMMON_FAQ("Canada"),
  },
  {
    slug: "serbia",
    flag: "rs",
    authority: "Ministry of Foreign Affairs of the Republic of Serbia",
    intro: "Serbia's visa rules are published by its Ministry of Foreign Affairs. Applications can be made at a Serbian embassy or consulate or through the official online portal.",
    categories: ["Short stay (Visa C)", "Long stay (Visa D) — e.g. employment, education, family reunification", "Study", "Work"],
    officialLinks: [
      { label: "Ministry of Foreign Affairs – Visa requirements", url: "https://mfa.gov.rs/en/citizens/travel-serbia/visa-requirements", checkedOn: "2026-10-22" },
      { label: "Welcome to Serbia portal (online visa applications)", url: "https://welcometoserbia.gov.rs", checkedOn: "2026-10-22" },
    ],
    facts: [
      {
        text: "Visa C is for short stays of up to 90 days within any 180-day period; Visa D is for stays of 90 to 180 days, such as employment, education or family reunification.",
        sourceLabel: "Ministry of Foreign Affairs – Visa requirements",
        sourceUrl: "https://mfa.gov.rs/en/citizens/travel-serbia/visa-requirements",
      },
      {
        text: "Visas can be applied for at a Serbian embassy or consulate, or online through welcometoserbia.gov.rs (which requires a registered account on the national Electronic Identification Portal).",
        sourceLabel: "Ministry of Foreign Affairs – Visa requirements",
        sourceUrl: "https://mfa.gov.rs/en/citizens/travel-serbia/visa-requirements",
      },
      {
        text: "Since 23 April 2025 Serbia issues electronic Digital Travel Authorizations to nationals of countries enabled on the portal that meet the stated criteria; other applicants receive a visa sticker. The page does not say which nationalities are enabled — check the portal for your passport.",
        sourceLabel: "Ministry of Foreign Affairs – Visa requirements",
        sourceUrl: "https://mfa.gov.rs/en/citizens/travel-serbia/visa-requirements",
      },
      {
        text: "General requirements listed include a completed form, a passport valid at least 90 days beyond the intended departure with two blank pages and issued within the last 10 years, a photo, the visa fee, proof of purpose, valid travel medical insurance, and evidence such as accommodation and sufficient funds. Missions may request more documents.",
        sourceLabel: "Ministry of Foreign Affairs – Visa requirements",
        sourceUrl: "https://mfa.gov.rs/en/citizens/travel-serbia/visa-requirements",
      },
    ],
    lastVerified: "2026-10-22",
    faqs: [
      ...COMMON_FAQ("Serbia"),
      { q: "Can I get an e-visa for Serbia?", a: "Serbia issues electronic Digital Travel Authorizations only to nationals of countries enabled on its official portal. Check the portal for your passport; if your nationality is not enabled you apply for a visa sticker." },
    ],
  },
  {
    slug: "mexico",
    flag: "mx",
    authority: "Secretaría de Relaciones Exteriores (SRE) and Mexican consulates",
    intro: "Mexican visas are issued by the Ministry of Foreign Affairs through its embassies and consulates. Requirements depend on the visa type and your nationality.",
    categories: GENERIC_CATEGORIES,
    officialLinks: [{ label: "Mexican consular network (SRE) – Visas", url: "https://consulmex.sre.gob.mx" }],
    facts: [],
    lastVerified: null,
    faqs: COMMON_FAQ("Mexico"),
  },
  {
    slug: "china",
    flag: "cn",
    authority: "Chinese embassies and consulates (Ministry of Foreign Affairs)",
    intro: "Chinese visas are processed by Chinese embassies and consulates, generally through an online application form and a visa application service centre. Requirements depend on the visa category and your nationality.",
    categories: GENERIC_CATEGORIES,
    officialLinks: [{ label: "China Online Visa Application", url: "https://cova.mfa.gov.cn" }],
    facts: [],
    lastVerified: null,
    faqs: COMMON_FAQ("China"),
  },
  {
    slug: "turkey",
    flag: "tr",
    entry: "evisa",
    authority: "Türkiye e-Visa system (Ministry of Foreign Affairs)",
    intro: "Türkiye is reported to accept online e-visa applications from some Pakistani applicants. Eligibility, fees, validity and conditions change, so always confirm on the official portal before you pay or travel.",
    categories: ["Visit / tourism"],
    officialLinks: [{ label: "Türkiye e-Visa", url: "https://www.evisa.gov.tr" }],
    facts: [],
    lastVerified: null,
    faqs: COMMON_FAQ("Türkiye"),
  },
  {
    slug: "united-arab-emirates",
    flag: "ae",
    entry: "evisa",
    authority: "Federal Authority for Identity, Citizenship, Customs & Port Security (ICP)",
    intro: "United Arab Emirates is reported to accept online e-visa applications from some Pakistani applicants. Eligibility, fees, validity and conditions change, so always confirm on the official portal before you pay or travel.",
    categories: ["Visit / tourism"],
    officialLinks: [{ label: "ICP – UAE visas", url: "https://icp.gov.ae" }],
    facts: [],
    lastVerified: null,
    faqs: COMMON_FAQ("United Arab Emirates"),
  },
  {
    slug: "malaysia",
    flag: "my",
    entry: "evisa",
    authority: "Immigration Department of Malaysia",
    intro: "Malaysia is reported to accept online e-visa applications from some Pakistani applicants. Eligibility, fees, validity and conditions change, so always confirm on the official portal before you pay or travel.",
    categories: ["Visit / tourism"],
    officialLinks: [{ label: "Immigration Department of Malaysia", url: "https://www.imi.gov.my" }],
    facts: [],
    lastVerified: null,
    faqs: COMMON_FAQ("Malaysia"),
  },
  {
    slug: "thailand",
    flag: "th",
    entry: "evisa",
    authority: "Royal Thai Embassy / Thailand e-Visa",
    intro: "Thailand is reported to accept online e-visa applications from some Pakistani applicants. Eligibility, fees, validity and conditions change, so always confirm on the official portal before you pay or travel.",
    categories: ["Visit / tourism"],
    officialLinks: [{ label: "Thailand e-Visa", url: "https://www.thaievisa.go.th" }],
    facts: [],
    lastVerified: null,
    faqs: COMMON_FAQ("Thailand"),
  },
  {
    slug: "azerbaijan",
    flag: "az",
    entry: "evisa",
    authority: "ASAN Visa (Azerbaijan e-Visa)",
    intro: "Azerbaijan is reported to accept online e-visa applications from some Pakistani applicants. Eligibility, fees, validity and conditions change, so always confirm on the official portal before you pay or travel.",
    categories: ["Visit / tourism"],
    officialLinks: [{ label: "Azerbaijan e-Visa portal", url: "https://evisa.gov.az" }],
    facts: [],
    lastVerified: null,
    faqs: COMMON_FAQ("Azerbaijan"),
  },
  {
    slug: "vietnam",
    flag: "vn",
    entry: "evisa",
    authority: "Vietnam Immigration Department",
    intro: "Vietnam is reported to accept online e-visa applications from some Pakistani applicants. Eligibility, fees, validity and conditions change, so always confirm on the official portal before you pay or travel.",
    categories: ["Visit / tourism"],
    officialLinks: [{ label: "Vietnam e-Visa portal", url: "https://evisa.gov.vn" }],
    facts: [],
    lastVerified: null,
    faqs: COMMON_FAQ("Vietnam"),
  },
  {
    slug: "indonesia",
    flag: "id",
    entry: "evisa",
    authority: "Directorate General of Immigration, Indonesia",
    intro: "Indonesia is reported to accept online e-visa applications from some Pakistani applicants. Eligibility, fees, validity and conditions change, so always confirm on the official portal before you pay or travel.",
    categories: ["Visit / tourism"],
    officialLinks: [{ label: "Indonesia e-Visa", url: "https://evisa.imigrasi.go.id" }],
    facts: [],
    lastVerified: null,
    faqs: COMMON_FAQ("Indonesia"),
  },
  {
    slug: "georgia",
    flag: "ge",
    entry: "evisa",
    authority: "Georgia e-Visa portal",
    intro: "Georgia is reported to accept online e-visa applications from some Pakistani applicants. Eligibility, fees, validity and conditions change, so always confirm on the official portal before you pay or travel.",
    categories: ["Visit / tourism"],
    officialLinks: [{ label: "Georgia e-Visa", url: "https://www.evisa.gov.ge" }],
    facts: [],
    lastVerified: null,
    faqs: COMMON_FAQ("Georgia"),
  },
  {
    slug: "oman",
    flag: "om",
    entry: "evisa",
    authority: "Royal Oman Police",
    intro: "Oman is reported to accept online e-visa applications from some Pakistani applicants. Eligibility, fees, validity and conditions change, so always confirm on the official portal before you pay or travel.",
    categories: ["Visit / tourism"],
    officialLinks: [{ label: "Oman e-Visa", url: "https://evisa.rop.gov.om" }],
    facts: [],
    lastVerified: null,
    faqs: COMMON_FAQ("Oman"),
  },
  {
    slug: "maldives",
    flag: "mv",
    entry: "visa-free",
    authority: "Maldives Immigration",
    intro: "Maldives is reported to allow Pakistani passport holders visa-free, on-arrival or electronic-authorisation entry under conditions. Rules change, so always confirm the current requirement on the official site before you travel.",
    categories: ["Visit / tourism"],
    officialLinks: [{ label: "Maldives Immigration", url: "https://immigration.gov.mv" }],
    facts: [],
    lastVerified: null,
    faqs: COMMON_FAQ("Maldives"),
  },
  {
    slug: "nepal",
    flag: "np",
    entry: "visa-free",
    authority: "Department of Immigration, Nepal",
    intro: "Nepal is reported to allow Pakistani passport holders visa-free, on-arrival or electronic-authorisation entry under conditions. Rules change, so always confirm the current requirement on the official site before you travel.",
    categories: ["Visit / tourism"],
    officialLinks: [{ label: "Department of Immigration, Nepal", url: "https://www.immigration.gov.np" }],
    facts: [],
    lastVerified: null,
    faqs: COMMON_FAQ("Nepal"),
  },
  {
    slug: "sri-lanka",
    flag: "lk",
    entry: "visa-free",
    authority: "Sri Lanka Electronic Travel Authorization (ETA)",
    intro: "Sri Lanka is reported to allow Pakistani passport holders visa-free, on-arrival or electronic-authorisation entry under conditions. Rules change, so always confirm the current requirement on the official site before you travel.",
    categories: ["Visit / tourism"],
    officialLinks: [{ label: "Sri Lanka ETA", url: "https://eta.gov.lk" }],
    facts: [],
    lastVerified: null,
    faqs: COMMON_FAQ("Sri Lanka"),
  },
  {
    slug: "kenya",
    flag: "ke",
    entry: "visa-free",
    authority: "Kenya eTA (Department of Immigration)",
    intro: "Kenya is reported to allow Pakistani passport holders visa-free, on-arrival or electronic-authorisation entry under conditions. Rules change, so always confirm the current requirement on the official site before you travel.",
    categories: ["Visit / tourism"],
    officialLinks: [{ label: "Kenya eTA", url: "https://www.etakenya.go.ke" }],
    facts: [],
    lastVerified: null,
    faqs: COMMON_FAQ("Kenya"),
  },
  {
    slug: "seychelles",
    flag: "sc",
    entry: "visa-free",
    authority: "Seychelles Travel Authorization",
    intro: "Seychelles is reported to allow Pakistani passport holders visa-free, on-arrival or electronic-authorisation entry under conditions. Rules change, so always confirm the current requirement on the official site before you travel.",
    categories: ["Visit / tourism"],
    officialLinks: [{ label: "Seychelles Travel Authorization", url: "https://seychelles.govtas.com" }],
    facts: [],
    lastVerified: null,
    faqs: COMMON_FAQ("Seychelles"),
  },
];

/** Core study/work/visit destinations (excludes the e-visa / visa-free directory). */
export const CORE_CONTENT = COUNTRY_CONTENT.filter((c) => !c.entry);

export function getCountryContent(slug: string): CountryContent | undefined {
  return COUNTRY_CONTENT.find((c) => c.slug === slug);
}

/** Generic, indicative checklists by purpose — NOT a substitute for the official list. */
export const CHECKLISTS: Record<"study" | "work" | "visit", { title: string; items: string[] }> = {
  study: {
    title: "Study — indicative checklist",
    items: [
      "Passport with sufficient validity (check the official requirement)",
      "Recent photographs meeting the official specification",
      "Offer / admission letter from the institution",
      "Academic transcripts and certificates",
      "Language-test evidence, if the institution or authority asks for it",
      "Evidence of funds for tuition and living costs, as required",
      "Statement of purpose or study plan, if requested",
      "Medical or police certificates, if requested",
    ],
  },
  work: {
    title: "Work — indicative checklist",
    items: [
      "Passport with sufficient validity (check the official requirement)",
      "Recent photographs meeting the official specification",
      "Job offer or employment contract, where the route needs one",
      "Updated CV",
      "Qualification certificates and experience letters",
      "Any licence, registration or skills assessment required for your occupation",
      "Medical or police certificates, if requested",
    ],
  },
  visit: {
    title: "Visit — indicative checklist",
    items: [
      "Passport with sufficient validity (check the official requirement)",
      "Recent photographs meeting the official specification",
      "Purpose of trip and planned itinerary",
      "Accommodation details or an invitation, where relevant",
      "Evidence of funds for the trip",
      "Evidence of ties to your home country (e.g. employment or study letters)",
      "Travel insurance, if required",
    ],
  },
};

export const GENERIC_PROCESS = [
  "Identify the correct visa category on the official website.",
  "Read the official eligibility rules, fees and processing information.",
  "Prepare the documents requested by the authority.",
  "Complete and submit the application through the official channel.",
  "Pay official fees directly to the authority and follow its instructions.",
];

export const INDICATIVE_CHECKLIST = CHECKLISTS.visit.items;
