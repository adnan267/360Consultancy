import type { Country, Service } from "@/lib/types";

/**
 * Seed / fallback catalogue. The database is the source of truth for fees
 * (booking prices are ALWAYS read from the database, never from here).
 * These values are used only to render public pages when the database is not
 * yet configured, and are inserted by supabase/migrations/0002_seed.sql.
 *
 * ALL FEES BELOW ARE PROPOSED, NOT CONFIRMED by the business owner.
 */
const REFUND_PLACEHOLDER =
  "Refund and cancellation conditions are set out in the Refund and Cancellation Policy (draft — pending owner approval).";

export const SEED_SERVICES: Service[] = [
  {
    id: "seed-visa-guidance-session",
    slug: "visa-guidance-session",
    title: "Visa Guidance Session",
    summary: "A 30-minute online consultation to understand your options and the general process.",
    description:
      "A focused conversation about your travel, study or work goal. We explain the general visa categories that may apply, the usual document requirements and sensible next steps, using official sources as the reference.",
    scope: "Initial guidance and orientation only.",
    inclusions: [
      "30-minute one-to-one online session",
      "Overview of general visa options for your goal",
      "Indicative document checklist based on official sources",
      "Suggested next steps and official links",
    ],
    exclusions: [
      "Submission of any application",
      "Legal advice",
      "Government, embassy or biometric fees",
      "Any guarantee of a visa or immigration outcome",
    ],
    duration_minutes: 30,
    fee_pkr: 1500,
    fee_is_starting_price: false,
    fee_needs_review: true,
    is_active: true,
    refund_terms: REFUND_PLACEHOLDER,
    sort_order: 1,
  },
  {
    id: "seed-document-review",
    slug: "document-review",
    title: "Document Review",
    summary: "A careful check of the documents you have prepared against the official checklist.",
    description:
      "You prepare your documents; we review them against the published official requirements and tell you what looks complete, what may be missing and what to clarify before you apply.",
    scope: "Review and written feedback on documents prepared by you.",
    inclusions: [
      "Review against the official checklist for your visa category",
      "Written summary of gaps and suggestions",
      "One follow-up clarification message",
    ],
    exclusions: [
      "Preparing or translating documents on your behalf",
      "Submitting the application",
      "Government, embassy or biometric fees",
      "Any guarantee of a visa or immigration outcome",
    ],
    duration_minutes: null,
    fee_pkr: 3500,
    fee_is_starting_price: false,
    fee_needs_review: true,
    is_active: true,
    refund_terms: REFUND_PLACEHOLDER,
    sort_order: 2,
  },
  {
    id: "seed-application-assistance",
    slug: "application-assistance",
    title: "Application Assistance",
    summary: "Step-by-step help organising and completing your application. Availability pending regulatory review.",
    description:
      "Practical help understanding the application form, organising supporting documents and preparing for submission. You remain the applicant and are responsible for the accuracy of everything you submit.",
    scope: "Guided assistance. Scope depends on destination and visa category.",
    inclusions: [
      "Walk-through of the official application steps",
      "Help organising supporting documents",
      "Pre-submission checklist",
    ],
    exclusions: [
      "Representing you before an embassy or authority",
      "Government, embassy or biometric fees",
      "Legal advice",
      "Any guarantee of a visa or immigration outcome",
    ],
    duration_minutes: null,
    fee_pkr: 7500,
    fee_is_starting_price: true,
    fee_needs_review: true,
    // Regulated activity: stays inactive until licensing requirements are confirmed.
    is_active: false,
    refund_terms: REFUND_PLACEHOLDER,
    sort_order: 3,
  },
];

export const SEED_COUNTRIES: Country[] = [
  { id: "seed-united-states", slug: "united-states", name: "United States", iso_code: "US", is_active: true, sort_order: 1 },
  { id: "seed-united-kingdom", slug: "united-kingdom", name: "United Kingdom", iso_code: "GB", is_active: true, sort_order: 2 },
  { id: "seed-australia", slug: "australia", name: "Australia", iso_code: "AU", is_active: true, sort_order: 3 },
  { id: "seed-canada", slug: "canada", name: "Canada", iso_code: "CA", is_active: true, sort_order: 4 },
  { id: "seed-serbia", slug: "serbia", name: "Serbia", iso_code: "RS", is_active: true, sort_order: 5 },
  { id: "seed-mexico", slug: "mexico", name: "Mexico", iso_code: "MX", is_active: true, sort_order: 6 },
  { id: "seed-china", slug: "china", name: "China", iso_code: "CN", is_active: true, sort_order: 7 },
  { id: "seed-other", slug: "other", name: "Other / not sure yet", iso_code: "—", is_active: true, sort_order: 99 },
];
