/**
 * Built-in ad landing pages (/lp/<slug>). Admins can override any of these, or add new ones,
 * under Admin → Landing pages (stored in the landing_pages table; see lib/landing.ts).
 * Copy follows ad-platform rules and our own site rules:
 * no guarantees, no invented fees, statistics, reviews or timelines.
 */
import type { Purpose } from "@/lib/wizard";
export interface LandingPage {
  slug: string;
  purpose: Purpose;
  /** Pre-selects this destination in the assessment wizard. */
  destination?: string;
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
const REFUND = { q: "What if you do not deliver your service?", a: "If we do not deliver the service you paid for, you can request a refund. See our Refund and Cancellation Policy." };
const FREE_ASSESSMENT = { q: "Is the assessment really free?", a: "Yes. The online assessment is free and does not commit you to anything. It is a planning tool, not an eligibility decision." };

export const LANDING_PAGES: LandingPage[] = [
  {
    slug: "study-abroad", purpose: "study", title: "Study abroad guidance", headline: "Plan your study abroad journey with clear, honest guidance",
    sub: "Compare destinations, understand each step and get your documents in order before you apply — with official sources linked at every step.",
    bullets: ["Destination and course guidance for your profile", "Personal document checklist", "Consultant review of your file", "Help planning English tests and deadlines", "Scholarship options with official links", "Official sources linked, never guesses"],
    faqs: [
      FREE_ASSESSMENT,
      { q: "Can you help with university admissions?", a: "We guide you on the steps and your documents. Admission decisions are made by the university." },
      { q: "Which countries can I study in?", a: "We cover the destinations listed on our website, including the UK, Canada, Australia, Germany and more. For each we link to the official source." },
      NOT_GUARANTEE, FEES,
    ],
  },
  {
    slug: "mbbs-abroad", purpose: "study", title: "MBBS abroad guidance", headline: "Thinking of studying MBBS abroad? Get the facts before you commit",
    sub: "Compare Russia, Kyrgyzstan and Uzbekistan, understand the steps and know what to verify before you pay any university.",
    bullets: ["Guidance on Russia, Kyrgyzstan and Uzbekistan", "Document checklist for admission and visa", "What to confirm about university and degree recognition", "Questions to ask before paying any fee", "Official sources linked, no guesses"],
    faqs: [
      { q: "Is the MBBS degree recognised in Pakistan?", a: "Recognition depends on the university and on the rules of the relevant Pakistani medical regulator, which can change. Confirm with the regulator before you enrol." },
      { q: "Do you guarantee admission?", a: "No. The university decides. We guide the steps and your documents." },
      { q: "What should I check before paying a university?", a: "Confirm the university's official website, its recognition status with the relevant regulator, the language of instruction and the full cost in writing. We help you prepare these questions." },
      REFUND, FEES,
    ],
  },
  {
    slug: "work-abroad", purpose: "work", title: "Work visa guidance", headline: "Exploring work abroad? Understand the official routes first",
    sub: "Learn how work visas generally work in your chosen country, what employers and authorities usually ask for, and how to prepare your documents.",
    bullets: ["Overview of official work visa routes", "CV and document checklist for your case", "Consultant review of your file", "Warning signs of job and visa scams", "Official sources linked, no guesses"],
    faqs: [
      { q: "Do you provide jobs or job offers?", a: "No. We are a consultancy, not a recruitment agency. We guide you on official visa routes and your documents. Never pay anyone who promises a job or visa in exchange for money." },
      { q: "Which countries do you cover?", a: "See the destinations on our website. For each we link to the official source and explain the general process." },
      NOT_GUARANTEE, FEES,
    ],
  },
  {
    slug: "visit-visa", purpose: "visit", title: "Visit & tourist visa guidance", headline: "Visit visa guidance, explained step by step",
    sub: "Know what to prepare for a tourist, family or business visit, and avoid common mistakes in your file.",
    bullets: ["Checklist for your visit type", "Review of your documents before you submit", "Help with a clear travel plan", "Plain-language explanation of each step", "Links to the official application pages"],
    faqs: [
      FREE_ASSESSMENT,
      { q: "Which countries do you cover?", a: "See the destinations on our website. For each we link to the official source and explain the general process." },
      { q: "Can you book my appointment or submit for me?", a: "We guide you through the official process and check your documents. Appointments and submissions are made on the official portal." },
      NOT_GUARANTEE, FEES,
    ],
  },
  {
    slug: "scholarships", purpose: "study", title: "Scholarship application assistance", headline: "Find scholarships and prepare a stronger application",
    sub: "Browse opportunities with official links, then get help organising your documents, deadlines and statements.",
    bullets: ["Scholarship finder with official links", "Help organising documents and deadlines", "Guidance on application requirements", "Feedback on your statement structure", "No promise of selection, ever"],
    faqs: [
      { q: "Will I get a scholarship?", a: "Scholarships are competitive and decided by the provider. We help you prepare; we cannot promise selection." },
      { q: "Will you write my personal statement?", a: "No. Your statement must be your own work. We give feedback on structure and clarity so you can improve it." },
      FEES,
    ],
  },
  {
    slug: "document-review", purpose: "unsure", title: "Document review & application preparation", headline: "Get your visa documents reviewed before you submit",
    sub: "A consultant checks your file for gaps and gives you written feedback so you can fix issues early.",
    bullets: ["Secure document upload", "Written feedback and correction requests", "Clear list of missing items", "Consistency check across your documents", "Your files stay private"], serviceSlug: "document-review",
    faqs: [
      { q: "How are my documents handled?", a: "They are uploaded securely, visible only to authorised staff and you, and handled under our Privacy Policy." },
      { q: "Do you change or create documents?", a: "No. We never alter or create documents. We tell you what is missing or unclear so you can get the correct document from the right source." },
      NOT_GUARANTEE, REFUND, FEES,
    ],
  },
  {
    slug: "interview-preparation", purpose: "unsure", title: "Interview preparation", headline: "Prepare calmly for your visa or admission interview",
    sub: "Understand typical question types, organise your answers and practise with guidance.",
    bullets: ["Guidance on common question types", "Help structuring honest answers", "Document and story consistency check", "Practice session with feedback", "No scripted or false answers — ever"],
    faqs: [
      { q: "Will you tell me what to say?", a: "No. We help you prepare honest, clear answers about your own situation. We never coach false statements." },
      NOT_GUARANTEE, FEES,
    ],
  },
  {
    slug: "business-setup", purpose: "work", title: "Business setup consultation", headline: "Thinking of setting up a business abroad? Start with a consultation",
    sub: "Talk through your plan, understand the general steps and know which official bodies to contact.",
    bullets: ["Initial consultation on your plan", "Overview of general steps", "Pointers to official registries and authorities", "Honest about what we can and cannot do"], serviceSlug: "business-setup-consultation",
    faqs: [
      { q: "Do you provide legal or tax advice?", a: "No. We give general guidance and point you to the official bodies. For legal or tax advice please consult a licensed professional." },
      FEES,
    ],
  },
];

export const getLanding = (slug: string) => LANDING_PAGES.find((l) => l.slug === slug);
