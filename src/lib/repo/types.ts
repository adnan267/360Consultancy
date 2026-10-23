import type {
  AdminUser,
  Case,
  CaseDetail,
  CaseDocument,
  CaseListRow,
  CasePayment,
  CasePurpose,
  CaseStage,
  CaseStatus,
  Client,
  DocStatus,
  DocType,
  Lead,
  LeadStatus,
  Scholarship,
  ScholarshipFilter,
  AuditEntry,
  Booking,
  BookingDetail,
  BookingFilter,
  BookingListRow,
  Country,
  Payment,
  Service,
} from "../types";
import type { ServicePatch } from "../validation";

export interface NewBookingRow {
  reference: string;
  full_name: string;
  email: string;
  phone: string;
  country_id: string;
  service_id: string;
  preferred_at: string;
  message: string;
  fee_pkr: number;
}

export interface PaymentPatch {
  status?: Payment["status"];
  bank_reference?: string | null;
  received_amount_pkr?: number | null;
  verified_by?: string | null;
  verified_at?: string | null;
}

export interface Stats {
  totalBookings: number;
  byStatus: Record<string, number>;
  verifiedRevenuePkr: number;
  pendingRevenuePkr: number;
  last30DaysBookings: number;
}

export interface Report {
  byCountry: { name: string; count: number }[];
  byService: { title: string; count: number }[];
  /** YYYY-MM → verified revenue in PKR (only payments with status verified). */
  verifiedByMonth: { month: string; amountPkr: number; count: number }[];
}

export interface NewLeadRow {
  name: string;
  email: string;
  phone: string | null;
  purpose: string;
  destination: string;
  answers: Record<string, unknown>;
  suggested_services: string[];
}

export interface NewPaymentEventRow {
  provider: string;
  event_id: string;
  booking_id: string | null;
  type: string;
  amount_pkr: number;
}

export class DuplicateReferenceError extends Error {}
export class DuplicateEmailError extends Error {}

export interface NewClientRow { email: string; password_hash: string; full_name: string; phone: string | null }
export interface NewCaseRow { reference: string; client_id: string; country_id: string; purpose: CasePurpose; intake_amount_pkr: number }
export interface CasePatch {
  status?: CaseStatus;
  submission_quote_pkr?: number | null;
  review_report?: string | null;
  review_completed_at?: string | null;
  submission_reference?: string | null;
  submission_notes?: string | null;
  submitted_at?: string | null;
}
export interface CasePaymentPatch {
  status?: CasePayment["status"];
  client_reference?: string | null;
  bank_reference?: string | null;
  received_amount_pkr?: number | null;
  verified_by?: string | null;
  verified_at?: string | null;
}
export interface NewDocumentRow { case_id: string; doc_type: DocType; original_name: string; storage_path: string; mime: CaseDocument["mime"]; size_bytes: number }
export interface CaseStats { byStatus: Record<string, number>; paymentsToVerify: number; docsToReview: number }

/** Persistence primitives only. All business rules live in lib/bookings.ts. */
export interface Repo {
  listServices(opts?: { activeOnly?: boolean }): Promise<Service[]>;
  getServiceBySlug(slug: string): Promise<Service | null>;
  updateService(id: string, patch: ServicePatch): Promise<Service | null>;

  listCountries(opts?: { activeOnly?: boolean }): Promise<Country[]>;
  getCountryBySlug(slug: string): Promise<Country | null>;

  insertBooking(row: NewBookingRow): Promise<{ booking: Booking; payment: Payment }>;
  getBookingDetail(id: string): Promise<BookingDetail | null>;
  listBookings(filter: BookingFilter): Promise<{ rows: BookingListRow[]; total: number }>;
  setBookingStatus(id: string, status: Booking["status"]): Promise<void>;
  updatePayment(paymentId: string, patch: PaymentPatch): Promise<Payment>;

  appendAudit(entry: AuditEntry): Promise<void>;
  listAudit(opts?: { bookingId?: string; caseId?: string; limit?: number }): Promise<AuditEntry[]>;

  insertLead(row: NewLeadRow): Promise<Lead>;
  listLeads(opts: { limit: number; offset: number }): Promise<{ rows: Lead[]; total: number }>;
  setLeadStatus(id: string, status: LeadStatus): Promise<Lead | null>;

  listScholarships(filter: ScholarshipFilter): Promise<Scholarship[]>;

  // ── client portal ──
  createClientAccount(row: NewClientRow): Promise<Client>; // throws DuplicateEmailError
  getClientByEmail(email: string): Promise<Client | null>;
  getClientById(id: string): Promise<Client | null>;
  recordClientLogin(id: string): Promise<void>;

  insertCase(row: NewCaseRow): Promise<CaseDetail>; // also creates the intake payment; throws DuplicateReferenceError
  getCaseDetail(id: string): Promise<CaseDetail | null>;
  listCasesForClient(clientId: string): Promise<CaseListRow[]>;
  listCases(f: { status?: CaseStatus; q?: string; limit: number; offset: number }): Promise<{ rows: CaseListRow[]; total: number }>;
  /** Conditional update: applies only if the case is currently in `expectStatus`; returns false otherwise (lost race). */
  updateCase(id: string, patch: CasePatch, expectStatus: CaseStatus): Promise<boolean>;
  insertCasePayment(row: { case_id: string; stage: CaseStage; amount_pkr: number }): Promise<CasePayment>;
  updateCasePayment(id: string, patch: CasePaymentPatch): Promise<CasePayment>;
  insertDocument(row: NewDocumentRow): Promise<CaseDocument>;
  getDocument(id: string): Promise<CaseDocument | null>;
  updateDocument(id: string, patch: { status?: DocStatus; admin_note?: string | null }): Promise<CaseDocument | null>;
  deleteDocument(id: string): Promise<void>;
  getCaseStats(): Promise<CaseStats>;

  getBookingIdByReference(reference: string): Promise<string | null>;
  /** Idempotency: true if newly recorded, false if (provider, event_id) was already seen. */
  recordPaymentEvent(row: NewPaymentEventRow): Promise<boolean>;

  getReport(): Promise<Report>;
  getStats(): Promise<Stats>;

  getAdminByEmail(email: string): Promise<AdminUser | null>;
  recordAdminLogin(id: string): Promise<void>;

  /** Returns true if the action is allowed, false if the limit is exceeded. */
  hitRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean>;
}
