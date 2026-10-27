import { z } from "zod";

/**
 * Visa-options wizard. NOT an eligibility decision: it only collects a few
 * non-sensitive answers to suggest relevant services and resources.
 * Shared by the client (step validation) and the server (/api/leads).
 */
export const DESTINATIONS = ["united-states", "united-kingdom", "australia", "canada", "serbia", "mexico", "china", "undecided"] as const;
export const PURPOSES = ["study", "work", "visit", "unsure"] as const;
export type Purpose = (typeof PURPOSES)[number];

const opt = <T extends readonly [string, ...string[]]>(v: T) => z.enum(v);

export const wizardAnswersSchema = z.strictObject({
  purpose: opt(PURPOSES),
  destination: opt(DESTINATIONS),
  // study
  educationLevel: opt(["high_school", "bachelor", "master", "other"]).optional(),
  targetLevel: opt(["diploma", "bachelor", "master", "doctoral"]).optional(),
  fieldOfStudy: z.string().trim().max(80).optional(),
  englishTest: opt(["have", "planning", "none"]).optional(),
  // work
  yearsExperience: opt(["0-1", "2-4", "5-9", "10+"]).optional(),
  occupation: z.string().trim().max(80).optional(),
  jobOffer: opt(["yes", "looking", "no"]).optional(),
  // visit
  visitPurpose: opt(["tourism", "family", "business", "other"]).optional(),
  travelWindow: opt(["within_3_months", "3_to_6_months", "6_plus_months", "unsure"]).optional(),
  // common
  budgetBand: opt(["under_500k", "500k_1500k", "1500k_3000k", "3000k_plus", "unsure"]).optional(),
  fundingSource: opt(["self", "family", "scholarship", "employer", "mixed"]).optional(),
  timeline: opt(["asap", "within_3_months", "3_to_6_months", "flexible"]).optional(),
  wantsScholarshipHelp: z.boolean().optional(),
  wantsDocReview: z.boolean().optional(),
});
export type WizardAnswers = z.infer<typeof wizardAnswersSchema>;
export type WizardDraft = Partial<WizardAnswers>;

export type StepId = "purpose" | "destination" | "profile" | "budget" | "support" | "review";
export const STEP_ORDER: StepId[] = ["purpose", "destination", "profile", "budget", "support", "review"];

export const STEP_LABEL: Record<StepId, string> = {
  purpose: "Your goal",
  destination: "Destination",
  profile: "Your profile",
  budget: "Budget",
  support: "Support",
  review: "Review",
};

/** Returns field → message errors for a step; empty object = valid. Conditional on earlier answers. */
export function validateStep(step: StepId, a: WizardDraft): Record<string, string> {
  const e: Record<string, string> = {};
  const need = (k: keyof WizardAnswers, msg: string) => {
    if (a[k] === undefined || a[k] === "") e[k] = msg;
  };
  switch (step) {
    case "purpose":
      need("purpose", "Choose what you are planning");
      break;
    case "destination":
      need("destination", "Choose a destination or “Not decided”");
      break;
    case "profile":
      if (a.purpose === "study") {
        need("educationLevel", "Select your current education level");
        need("targetLevel", "Select the level you want to study");
        need("englishTest", "Select your English-test status");
      } else if (a.purpose === "work") {
        need("yearsExperience", "Select your years of experience");
        need("jobOffer", "Select your job-offer status");
        if (!a.occupation || a.occupation.trim().length < 2) e.occupation = "Tell us your occupation or field";
      } else if (a.purpose === "visit") {
        need("visitPurpose", "Select the purpose of your visit");
        need("travelWindow", "Select when you plan to travel");
      }
      break;
    case "budget":
      need("budgetBand", "Select a budget range");
      need("fundingSource", "Select how the costs will be funded");
      break;
    case "support":
      need("timeline", "Select your timeline");
      break;
    case "review": {
      const r = wizardAnswersSchema.safeParse(a);
      if (!r.success) e.form = "Some answers are missing or invalid — please go back and check.";
      break;
    }
  }
  return e;
}

/** Steps shown for the current answers (profile is skipped when purpose is "unsure"). */
export function activeSteps(a: WizardDraft): StepId[] {
  return STEP_ORDER.filter((s) => !(s === "profile" && (a.purpose === "unsure" || !a.purpose)));
}

export interface Suggestion {
  serviceSlugs: string[];
  links: { label: string; href: string }[];
  notes: string[];
}

/**
 * Pure, deterministic suggestions. Service slugs are matched against the
 * live (active) catalogue by the caller; inactive services are never shown.
 */
export function suggest(a: WizardDraft): Suggestion {
  const serviceSlugs = ["visa-guidance-session"];
  const links: Suggestion["links"] = [];
  const notes: string[] = [
    "These are suggestions to help you plan — not an eligibility assessment. Final decisions are made only by the relevant authority.",
  ];

  if (a.wantsDocReview || a.timeline === "asap" || a.timeline === "within_3_months") serviceSlugs.push("document-review");
  if (a.timeline === "asap") serviceSlugs.push("application-assistance");

  if (a.destination && a.destination !== "undecided") links.push({ label: "Read the destination guidance", href: `/countries/${a.destination}` });
  else links.push({ label: "Compare destinations", href: "/compare" });

  if (a.purpose === "study" && (a.wantsScholarshipHelp || a.fundingSource === "scholarship" || a.fundingSource === "mixed")) {
    const q = a.destination && a.destination !== "undecided" ? `?country=${a.destination}` : "";
    links.push({ label: "Browse the scholarship finder", href: `/scholarships${q}` });
    notes.push("Scholarships are competitive and never guaranteed. Always confirm eligibility and dates on the official page.");
  }
  if (a.purpose === "work") notes.push("Work routes usually depend on your occupation, qualifications and an employer. Confirm requirements on the official site.");
  if (a.purpose === "visit") notes.push("Visitor visa and e-visa options depend on your nationality. Check the destination's official portal.");
  links.push({ label: "Build a document checklist", href: `/tools/document-checklist${a.purpose && a.purpose !== "unsure" ? `?purpose=${a.purpose}` : ""}` });

  return { serviceSlugs: [...new Set(serviceSlugs)], links, notes };
}

export const leadContactSchema = z.strictObject({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.email("Please enter a valid email").max(254).transform((v) => v.toLowerCase()),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s\-()]{7,20}$/, "Please enter a valid phone / WhatsApp number")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  consentPrivacy: z.literal(true, { error: "You must accept the Privacy Policy" }),
  /** Honeypot */
  website: z.string().max(200).optional().default(""),
});

export const leadRequestSchema = z.strictObject({
  answers: wizardAnswersSchema,
  contact: leadContactSchema,
  extra: z.record(z.uuid(), z.string().trim().max(300)).refine((r) => Object.keys(r).length <= 30).optional(),
});
export type LeadRequest = z.infer<typeof leadRequestSchema>;

export const LABELS: Record<string, string> = {
  study: "Study", work: "Work", visit: "Visit / tourism", unsure: "Not sure yet",
  "united-states": "United States", "united-kingdom": "United Kingdom", australia: "Australia", canada: "Canada", serbia: "Serbia", mexico: "Mexico", china: "China", undecided: "Not decided",
  high_school: "High school", bachelor: "Bachelor's", master: "Master's", doctoral: "Doctoral", diploma: "Diploma", other: "Other",
  have: "Have a test result", planning: "Planning to take one", none: "No test planned",
  yes: "Yes", looking: "Looking", no: "No",
  tourism: "Tourism", family: "Family visit", business: "Business",
  within_3_months: "Within 3 months", "3_to_6_months": "3–6 months", "6_plus_months": "6+ months", unsure_: "Not sure",
  under_500k: "Under PKR 500,000", "500k_1500k": "PKR 500,000 – 1.5M", "1500k_3000k": "PKR 1.5M – 3M", "3000k_plus": "Over PKR 3M",
  self: "Self", family_: "Family", scholarship: "Scholarship", employer: "Employer", mixed: "A mix",
  asap: "As soon as possible", flexible: "Flexible",
};
