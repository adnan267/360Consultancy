export const BOOKING_STATUSES = [
  "request_received",
  "awaiting_payment",
  "payment_under_review",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const PAYMENT_STATUSES = ["awaiting", "under_review", "verified", "rejected", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  request_received: "Request received",
  awaiting_payment: "Awaiting payment",
  payment_under_review: "Payment under review",
  confirmed: "Confirmed",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  awaiting: "Awaiting payment",
  under_review: "Under review",
  verified: "Verified",
  rejected: "Rejected",
  refunded: "Refunded",
};

export const ROLES = ["admin", "staff", "consultant", "finance", "support"] as const;
export type Role = (typeof ROLES)[number];
export const ROLE_LABEL: Record<Role, string> = { admin: "Super Admin", staff: "Staff", consultant: "Consultant", finance: "Finance", support: "Customer Support" };

export interface Service {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  scope: string;
  inclusions: string[];
  exclusions: string[];
  duration_minutes: number | null;
  fee_pkr: number;
  fee_is_starting_price: boolean;
  /** true until the owner confirms the proposed price */
  fee_needs_review: boolean;
  is_active: boolean;
  refund_terms: string;
  sort_order: number;
  updated_at?: string;
}

export interface Country {
  id: string;
  slug: string;
  name: string;
  iso_code: string;
  is_active: boolean;
  sort_order: number;
}

export interface Booking {
  id: string;
  reference: string;
  full_name: string;
  email: string;
  phone: string;
  country_id: string;
  service_id: string;
  preferred_at: string;
  message: string;
  fee_pkr: number;
  currency: "PKR";
  status: BookingStatus;
  consent_privacy_at: string;
  consent_terms_at: string;
  delete_after: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  method: "bank_transfer";
  amount_pkr: number;
  status: PaymentStatus;
  bank_reference: string | null;
  received_amount_pkr: number | null;
  verified_by: string | null;
  verified_at: string | null;
  invoice_no: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditEntry {
  id?: string;
  booking_id: string | null;
  case_id?: string | null;
  actor_id: string | null;
  actor_label: string;
  action: string;
  from_value: string | null;
  to_value: string | null;
  meta: Record<string, unknown>;
  created_at?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  role: Role;
  is_active: boolean;
}

export interface Actor {
  id: string | null;
  label: string;
  role: Role | "system" | "public";
}

export interface BookingDetail {
  booking: Booking;
  payment: Payment;
  service: Pick<Service, "id" | "slug" | "title">;
  country: Pick<Country, "id" | "slug" | "name">;
  events: AuditEntry[];
}

export interface BookingListRow {
  id: string;
  reference: string;
  full_name: string;
  email: string;
  status: BookingStatus;
  payment_status: PaymentStatus;
  fee_pkr: number;
  service_title: string;
  country_name: string;
  preferred_at: string;
  created_at: string;
}

export interface BookingFilter {
  q?: string;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  limit: number;
  offset: number;
}

export const LEAD_STATUSES = ["new", "contacted", "closed"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  purpose: string;
  destination: string;
  answers: Record<string, unknown>;
  suggested_services: string[];
  status: LeadStatus;
  consent_privacy_at: string;
  delete_after: string;
  created_at: string;
}

export const FUNDING_TYPES = ["full", "partial", "other", "not_stated"] as const;
export type FundingType = (typeof FUNDING_TYPES)[number];
export const FUNDING_LABEL: Record<FundingType, string> = {
  full: "Full funding (as described by the provider)",
  partial: "Partial funding",
  other: "Other financial aid",
  not_stated: "Funding not stated — check the official source",
};

export interface Scholarship {
  id: string;
  slug: string;
  name: string;
  country_slug: string;
  provider: string;
  degree_levels: string[];
  funding_type: FundingType;
  funding_details: string;
  deadline: string | null;
  deadline_note: string;
  eligibility_summary: string;
  official_url: string;
  last_verified: string | null;
  is_published: boolean;
}

export interface ScholarshipFilter {
  q?: string;
  country?: string;
  level?: string;
  funding?: FundingType;
  publishedOnly?: boolean;
}

// ── Client portal ───────────────────────────────────────────────────────────
export const CASE_STATUSES = [
  "awaiting_intake_payment",
  "documents_open",
  "awaiting_review_payment",
  "in_review",
  "review_complete",
  "awaiting_submission_payment",
  "submission_in_progress",
  "submitted",
  "completed",
  "cancelled",
] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

export const CASE_STATUS_LABEL: Record<CaseStatus, string> = {
  awaiting_intake_payment: "Step 1 — pay the starting fee",
  documents_open: "Step 2 — upload your documents",
  awaiting_review_payment: "Step 3 — pay the review fee",
  in_review: "Step 4 — documents under review",
  review_complete: "Step 5 — review ready",
  awaiting_submission_payment: "Step 6 — pay the submission fee",
  submission_in_progress: "Step 7 — we are preparing your submission",
  submitted: "Submitted",
  completed: "Completed and handed over",
  cancelled: "Cancelled",
};

export const CASE_STAGES = ["intake", "review", "submission"] as const;
export type CaseStage = (typeof CASE_STAGES)[number];
export const CASE_STAGE_LABEL: Record<CaseStage, string> = { intake: "Starting fee", review: "Document review fee", submission: "Submission fee" };

export const CASE_PURPOSES = ["study", "work", "visit", "other"] as const;
export type CasePurpose = (typeof CASE_PURPOSES)[number];

export const DOC_TYPES = [
  "passport", "photo", "cnic", "transcript", "certificate", "experience_letter", "cv", "financial", "bank_statement",
  "income_tax_return", "language_test", "admission_letter", "family_registration", "marriage_registration",
  "employer_letter", "invitation_letter", "hotel_booking", "flight_booking", "travel_history", "visa_refusal",
  "sponsor_document", "other",
] as const;
export type DocType = (typeof DOC_TYPES)[number];
export const DOC_TYPE_LABEL: Record<DocType, string> = {
  passport: "Passport (colour copy, clear)", photo: "Photograph (white background, no glasses)", cnic: "CNIC (valid, both sides)",
  transcript: "Academic transcript", certificate: "Certificate / degree", experience_letter: "Experience letter", cv: "CV / resume",
  financial: "Financial evidence (income, savings, property)", bank_statement: "Bank statements (6 months) / account maintenance certificate",
  income_tax_return: "Income tax return (3 years)", language_test: "Language test result", admission_letter: "Admission / offer letter",
  family_registration: "Family Registration Certificate (FRC)", marriage_registration: "Marriage Registration Certificate (MRC)",
  employer_letter: "Company letter head / NOC / request letter", invitation_letter: "Invitation letter (from the host)",
  hotel_booking: "Stay details (hotel bookings)", flight_booking: "Travel dates / flight tickets or schedule",
  travel_history: "Travel history (detailed)", visa_refusal: "Visa refusal details (any country)",
  sponsor_document: "Sponsor documents (CNIC, NTN, chamber certificate, undertaking, etc.)", other: "Other",
};
export type DocStatus = "uploaded" | "accepted" | "needs_fix";

export interface Client {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone: string | null;
  is_active: boolean;
  consent_privacy_at: string;
  consent_terms_at: string;
  last_login_at: string | null;
  email_verified_at: string | null;
  created_at: string;
}

export interface Case {
  id: string;
  reference: string;
  client_id: string;
  country_id: string;
  purpose: CasePurpose;
  status: CaseStatus;
  submission_quote_pkr: number | null;
  review_report: string | null;
  review_completed_at: string | null;
  submission_reference: string | null;
  submission_notes: string | null;
  submitted_at: string | null;
  handover_at: string | null;
  handover_notes: string | null;
  decision: "approved" | "refused" | "withdrawn" | null;
  decision_at: string | null;
  decision_note: string | null;
  delete_after: string | null;
  created_at: string;
  updated_at: string;
}

export interface CasePayment {
  id: string;
  case_id: string;
  stage: CaseStage;
  amount_pkr: number;
  status: PaymentStatus;
  client_reference: string | null;
  bank_reference: string | null;
  received_amount_pkr: number | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  invoice_no: string | null;
  provider: string | null;
  provider_ref: string | null;
  provider_price: number | null;
  provider_currency: string | null;
  updated_at: string;
}

export interface CaseDeliverable {
  id: string;
  case_id: string;
  original_name: string;
  storage_path: string;
  mime: "application/pdf" | "image/jpeg" | "image/png";
  size_bytes: number;
  uploaded_by: string | null;
  uploaded_at: string;
}

export const DECISIONS = ["approved", "refused", "withdrawn"] as const;
export const DECISION_LABEL: Record<(typeof DECISIONS)[number], string> = { approved: "Approved by the authority", refused: "Refused by the authority", withdrawn: "Application withdrawn" };

export interface CaseDocument {
  id: string;
  case_id: string;
  doc_type: DocType;
  original_name: string;
  storage_path: string;
  mime: "application/pdf" | "image/jpeg" | "image/png";
  size_bytes: number;
  status: DocStatus;
  admin_note: string | null;
  uploaded_at: string;
}

export interface CaseDetail {
  case: Case;
  client: Pick<Client, "id" | "email" | "full_name" | "phone">;
  country: Pick<Country, "id" | "slug" | "name">;
  payments: CasePayment[];
  documents: CaseDocument[];
  deliverables: CaseDeliverable[];
  events: AuditEntry[];
}

export interface CaseListRow {
  id: string;
  reference: string;
  client_name: string;
  client_email: string;
  country_name: string;
  purpose: CasePurpose;
  status: CaseStatus;
  created_at: string;
}

// ── CMS, messages, requests ─────────────────────────────────────────────────
export interface Faq { id: string; question: string; answer: string; sort_order: number; is_published: boolean }
export interface LandingPageRow {
  slug: string; purpose: "study" | "work" | "visit" | "unsure"; destination: string | null;
  title: string; headline: string; sub: string; bullets: string[]; faqs: { q: string; a: string }[];
  service_slug: string | null; is_published: boolean; updated_at?: string;
}
export interface BlogPost {
  id: string; slug: string; title: string; excerpt: string; body: string;
  meta_title: string | null; meta_description: string | null;
  is_published: boolean; published_at: string | null; created_at: string; updated_at: string;
}
export interface CaseMessage { id: string; case_id: string; sender: "client" | "staff"; sender_label: string; body: string; internal: boolean; created_at: string }
export interface DataRequest { id: string; client_id: string; kind: "export" | "delete"; status: "open" | "done" | "rejected"; note: string | null; created_at: string; handled_at: string | null }
export interface AdminListRow { id: string; email: string; role: Role; is_active: boolean; last_login_at: string | null; created_at: string }

export type QuestionKind = "text" | "select" | "yesno";
export interface WizardQuestion { id: string; label: string; help: string | null; kind: QuestionKind; options: string[]; purpose: "study" | "work" | "visit" | "unsure" | null; required: boolean; sort_order: number; is_active: boolean }
export const EMAIL_TEMPLATE_KEYS = ["case_status", "payment_verified", "deliverables_ready", "new_message"] as const;
export type EmailTemplateKey = (typeof EMAIL_TEMPLATE_KEYS)[number];
export interface EmailTemplate { key: EmailTemplateKey; subject: string; body: string; updated_at: string }
export interface ClientNotification { id: string; client_id: string; case_id: string | null; title: string; body: string; link: string | null; read_at: string | null; created_at: string }
