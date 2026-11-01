import type { ReligiousSection } from "@/lib/types";

export interface ReligiousSubcategory {
  slug: ReligiousSection;
  title: string;
  short: string;
  intro: string;
  places: { name: string; note: string }[];
  prepare: string[];
  officialLinks: { label: string; url: string }[];
  /** Shown prominently when the trip cannot be arranged or needs extra care. */
  warning?: string;
  /** No bookings or packages are offered for this page. */
  infoOnly?: boolean;
  faqs: { q: string; a: string }[];
}

const GENERAL_FAQ = (what: string) => [
  { q: "Can you guarantee my visa or travel approval?", a: "No. Visa and entry decisions are made only by the relevant authorities. We guide your documents and planning; we never guarantee an outcome." },
  { q: `What does the ${what} price include?`, a: "Each package lists what is included. Anything not listed is not included. Your written quote confirms the exact scope and price before you pay." },
  { q: "Are government and visa fees included?", a: "Only if your quote says so. Government, embassy and visa fees are set by the authorities." },
];

export const RELIGIOUS_SUBCATEGORIES: ReligiousSubcategory[] = [
  {
    slug: "umrah",
    title: "Umrah Packages",
    short: "Umrah planning with clear documents, timing and dates.",
    intro: "Plan your Umrah with clear guidance on documents, visa steps and timing. Umrah is arranged through channels that the Saudi and Pakistani authorities allow, so we explain the current steps and help you prepare, then confirm the details in your written quote.",
    places: [
      { name: "Makkah", note: "Masjid al-Haram and the rites of Umrah." },
      { name: "Madinah", note: "Masjid an-Nabawi and the blessed city." },
    ],
    prepare: ["Passport valid for the period required by the Saudi authorities", "Passport-size photographs as required", "Vaccination and health requirements published by the Saudi Ministry of Health", "Your travel dates and number of travellers", "Any group or family details for the booking"],
    officialLinks: [{ label: "Nusuk (official Umrah and visit platform)", url: "https://nusuk.sa" }, { label: "Saudi Ministry of Hajj and Umrah", url: "https://haj.gov.sa" }, { label: "Ministry of Religious Affairs, Pakistan", url: "https://mora.gov.pk" }],
    faqs: [...GENERAL_FAQ("Umrah package"), { q: "When can I go for Umrah?", a: "Umrah seasons, visa availability and rules are set by Saudi Arabia and can change. Tell us your preferred dates and we will check the current position." }],
  },
  {
    slug: "hajj",
    title: "Hajj Packages",
    short: "Guidance for Hajj through the authorised schemes.",
    intro: "Hajj is organised through the Government of Pakistan's approved schemes and registered operators, under Saudi quotas and rules that are announced each year. We help you understand the steps, prepare your documents and avoid unauthorised offers. We do not promise a seat.",
    places: [
      { name: "Makkah", note: "Masjid al-Haram and the rites of Hajj." },
      { name: "Mina, Arafat and Muzdalifah", note: "The sacred sites of the Hajj days." },
      { name: "Madinah", note: "Masjid an-Nabawi." },
    ],
    prepare: ["Passport valid as required by the announced Hajj policy", "National identity card (CNIC)", "Medical and vaccination requirements announced for Hajj", "Application forms and fee details published by the Ministry of Religious Affairs", "Family or group details"],
    officialLinks: [{ label: "Ministry of Religious Affairs, Pakistan", url: "https://mora.gov.pk" }, { label: "Saudi Ministry of Hajj and Umrah", url: "https://haj.gov.sa" }, { label: "Nusuk", url: "https://nusuk.sa" }],
    warning: "Hajj places depend on the yearly government policy and quotas. Beware of anyone who promises a guaranteed seat. We only guide you through the official process.",
    faqs: [...GENERAL_FAQ("Hajj package"), { q: "Can you guarantee a Hajj seat?", a: "No. Seats depend on the government's yearly policy, quota and process. We guide you and help you stay within the official process." }],
  },
  {
    slug: "makkah-madinah-ziyarat",
    title: "Makkah & Madinah Ziyarat",
    short: "Guided visits to the blessed places of Makkah and Madinah.",
    intro: "Visit the historic and spiritual places in and around Makkah and Madinah with a clear plan, timings and local transport arranged in your quote. Ziyarat can be added to an Umrah package or planned on its own.",
    places: [
      { name: "Makkah", note: "Jabal al-Noor and the Cave of Hira, Mina, Arafat and Muzdalifah." },
      { name: "Madinah", note: "Masjid Quba, Masjid al-Qiblatayn, Mount Uhud and Jannat al-Baqi." },
    ],
    prepare: ["A valid Saudi visa that allows the visit", "Passport and travel details", "Comfortable clothing and walking shoes", "Your preferred dates and group size"],
    officialLinks: [{ label: "Nusuk", url: "https://nusuk.sa" }, { label: "Saudi Ministry of Hajj and Umrah", url: "https://haj.gov.sa" }],
    faqs: GENERAL_FAQ("Ziyarat package"),
  },
  {
    slug: "iraq-ziyarat",
    title: "Iraq Ziyarat (Najaf, Karbala, Kadhimayn)",
    short: "Ziyarat of the holy shrines in Najaf, Karbala and Kadhimayn.",
    intro: "Plan a ziyarat to the holy shrines of Iraq with clear guidance on visa, documents and timing. Travel conditions change, so we check current official advice with you before anything is confirmed.",
    places: [
      { name: "Najaf", note: "The shrine of Imam Ali (AS) and Wadi-us-Salaam." },
      { name: "Karbala", note: "The shrines of Imam Husayn (AS) and Hazrat Abbas (AS)." },
      { name: "Kadhimayn (Baghdad)", note: "The shrines of Imam Musa al-Kadhim (AS) and Imam Muhammad al-Jawad (AS)." },
    ],
    prepare: ["Passport with enough validity", "Passport-size photographs", "Iraq visa or e-visa as per current rules", "Your preferred dates, especially around Muharram and Arbaeen when demand is very high", "Group or family details"],
    officialLinks: [{ label: "Iraq e-visa portal", url: "https://visa.mofa.gov.iq" }],
    warning: "Check your government's current travel advice for Iraq before booking. Crowds and conditions are very different around Muharram and Arbaeen.",
    faqs: GENERAL_FAQ("Iraq ziyarat package"),
  },
  {
    slug: "iran-ziyarat",
    title: "Iran Ziyarat (Mashhad, Qom)",
    short: "Ziyarat of Imam Reza (AS) in Mashhad and Hazrat Masuma (SA) in Qom.",
    intro: "Plan a ziyarat to Iran with clear guidance on visa, documents and travel options. Rules and routes can change, so we confirm the current position before your plan is finalised.",
    places: [
      { name: "Mashhad", note: "The shrine of Imam Reza (AS)." },
      { name: "Qom", note: "The shrine of Hazrat Fatima Masuma (SA)." },
    ],
    prepare: ["Passport with enough validity", "Passport-size photographs", "Iran visa as per current rules", "Your preferred dates and travel route", "Group or family details"],
    officialLinks: [{ label: "Iran e-visa portal", url: "https://evisatraveller.mfa.ir" }],
    warning: "Check your government's current travel advice for Iran, including road and border routes, before booking.",
    faqs: GENERAL_FAQ("Iran ziyarat package"),
  },
  {
    slug: "jerusalem-al-aqsa",
    title: "Jerusalem & Al-Aqsa Tours",
    short: "Information about Al-Aqsa and Jerusalem. Travel is not available for Pakistani passports.",
    intro: "Al-Aqsa Mosque and the Dome of the Rock in Jerusalem are among the most revered sites in Islam. Many of our clients ask about visiting them.",
    places: [
      { name: "Al-Aqsa Mosque", note: "The first qibla of Muslims and the third holiest mosque in Islam." },
      { name: "Dome of the Rock", note: "In the Haram al-Sharif compound in Jerusalem." },
    ],
    prepare: ["Check your passport's own travel conditions", "Follow your government's travel advice", "Speak to us if your situation is different"],
    officialLinks: [{ label: "Ministry of Foreign Affairs, Pakistan", url: "https://mofa.gov.pk" }],
    warning: "Pakistani passports are not valid for travel to Israel, and entry to Jerusalem requires passing through Israel. We cannot arrange or sell this trip to Pakistani passport holders. If the rules ever change, we will update this page.",
    infoOnly: true,
    faqs: [
      { q: "Can I book a Jerusalem or Al-Aqsa tour with you?", a: "Not with a Pakistani passport. We do not arrange travel that your passport does not allow. Tell us if you hold another nationality and we will explain what applies to you." },
      { q: "Can you suggest other religious journeys?", a: "Yes. See Umrah, Ziyarat in Makkah and Madinah, Iraq, Iran and our other religious tours." },
    ],
  },
  {
    slug: "other-religious",
    title: "Other Religious Tours",
    short: "Other spiritual and heritage journeys planned around you.",
    intro: "Looking for a different spiritual or heritage journey? Tell us what you have in mind and we will check the entry requirements and send a quote.",
    places: [
      { name: "Türkiye", note: "Konya (Mevlana Rumi), Eyup Sultan Mosque and the historic mosques of Istanbul." },
      { name: "Jordan", note: "Sites linked to the Companions and the Prophets, subject to current requirements." },
      { name: "Central Asia", note: "The Sufi and Islamic heritage of Bukhara and Samarkand in Uzbekistan." },
    ],
    prepare: ["The places you want to visit", "Preferred dates and group size", "Passport with enough validity"],
    officialLinks: [],
    faqs: GENERAL_FAQ("religious tour package"),
  },
];

export const getReligious = (slug: string) => RELIGIOUS_SUBCATEGORIES.find((s) => s.slug === slug);
