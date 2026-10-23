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

export type Role = "admin" | "staff";

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
  cancelled: "Cancelled",
};

export const CASE_STAGES = ["intake", "review", "submission"] as const;
export type CaseStage = (typeof CASE_STAGES)[number];
export const CASE_STAGE_LABEL: Record<CaseStage, string> = { intake: "Starting fee", review: "Document review fee", submission: "Submission fee" };

export const CASE_PURPOSES = ["study", "work", "visit", "other"] as const;
export type CasePurpose = (typeof CASE_PURPOSES)[number];

export const DOC_TYPES = ["passport", "photo", "transcript", "certificate", "experience_letter", "financial", "language_test", "admission_letter", "other"] as const;
export type DocType = (typeof DOC_TYPES)[number];
export const DOC_TYPE_LABEL: Record<DocType, string> = {
  passport: "Passport (bio page)", photo: "Photograph", transcript: "Academic transcript", certificate: "Certificate / degree",
  experience_letter: "Experience letter", financial: "Financial evidence", language_test: "Language test result", admission_letter: "Admission / offer letter", other: "Other",
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
  updated_at: string;
}

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
