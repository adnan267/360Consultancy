/**
 * Ad landing pages (/lp/<slug>). Copy follows ad-platform rules and our own site rules:
 * no guarantees, no invented fees, statistics, reviews or timelines.
 */
export interface LandingPage {
  slug: string;
  purpose: "study" | "work" | "visit" | "unsure";
  title: string;
  headline: string;
  sub: string;
  bullets: string[];
  /** Matching slug in the services table, to show its live fee only if the admin has set one. */
  serviceSlug?: string;
  faqs: { q: string; a: string }[];
}

const NOT_GUARANTEE = { q: "Do you guarantee my visa?", a: "No. Only the relevant authority decides visa applications. We help you understand the process and prepare a clear, complete file." };
const FEES = { q: "Are your fees the same as embassy fees?", a: "No. Our consultancy fee is separate. Government, embassy and biometric fees are paid directly to the authority." };

export const LANDING_PAGES: LandingPage[] = [
  {
    slug: "study-abroad", purpose: "study", title: "Study abroad guidance", headline: "Plan your study abroad journey with clear guidance",
    sub: "Compare destinations, understand the steps and get your documents in order before you apply.",
    bullets: ["Destination and course guidance", "Document checklist for your case", "Review of your file by a consultant", "Official sources linked, never guesses"],
    faqs: [{ q: "Can you help with university admissions?", a: "We guide you on the steps and your documents. Admission decisions are made by the university." }, NOT_GUARANTEE, FEES],
  },
  {
    slug: "visit-visa", purpose: "visit", title: "Visit & tourist visa guidance", headline: "Visit visa guidance, explained step by step",
    sub: "Know what to prepare for a tourist, family or business visit, and avoid avoidable mistakes in your file.",
    bullets: ["Checklist for your visit type", "Review of your documents", "Plain-language explanation of each step", "Links to the official application pages"],
    faqs: [{ q: "Which countries do you cover?", a: "See the destinations on our website. For each we link to the official source and explain the general process." }, NOT_GUARANTEE, FEES],
  },
  {
    slug: "scholarships", purpose: "study", title: "Scholarship application assistance", headline: "Find scholarships and prepare a stronger application",
    sub: "Browse opportunities with official links, then get help organising your documents and statements.",
    bullets: ["Scholarship finder with official links", "Help organising documents and deadlines", "Guidance on application requirements", "No promise of selection, ever"],
    faqs: [{ q: "Will I get a scholarship?", a: "Scholarships are competitive and decided by the provider. We help you prepare; we cannot promise selection." }, FEES],
  },
  {
    slug: "document-review", purpose: "unsure", title: "Document review & application preparation", headline: "Get your visa documents reviewed before you submit",
    sub: "A consultant checks your file for gaps and gives you written feedback so you can fix issues early.",
    bullets: ["Secure document upload", "Written feedback and correction requests", "Clear list of missing items", "Your files stay private"], serviceSlug: "document-review",
    faqs: [{ q: "How are my documents handled?", a: "They are uploaded securely, visible only to authorised staff and you, and handled under our Privacy Policy." }, NOT_GUARANTEE, FEES],
  },
  {
    slug: "interview-preparation", purpose: "unsure", title: "Interview preparation", headline: "Prepare calmly for your visa or admission interview",
    sub: "Understand typical questions, organise your answers and practise with guidance.",
    bullets: ["Guidance on common question types", "Help structuring honest answers", "Document and story consistency check", "No scripted or false answers — ever"],
    faqs: [{ q: "Will you tell me what to say?", a: "No. We help you prepare honest, clear answers about your own situation. We never coach false statements." }, NOT_GUARANTEE],
  },
  {
    slug: "business-setup", purpose: "work", title: "Business setup consultation", headline: "Thinking of setting up a business abroad? Start with a consultation",
    sub: "Talk through your plan, understand the general steps and know which official bodies to contact.",
    bullets: ["Initial consultation on your plan", "Overview of general steps", "Pointers to official registries and authorities", "Honest about what we can and cannot do"], serviceSlug: "business-setup-consultation",
    faqs: [{ q: "Do you provide legal or tax advice?", a: "No. We give general guidance and point you to the official bodies. For legal or tax advice please consult a licensed professional." }, FEES],
  },
];

export const getLanding = (slug: string) => LANDING_PAGES.find((l) => l.slug === slug);
