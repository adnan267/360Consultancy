import type {
  AdminListRow,
  BlogPost,
  CaseMessage,
  DataRequest,
  Faq,
  Role,
  AdminUser,
  Case,
  CaseDetail,
  CaseDeliverable,
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
  handover_at?: string | null;
  handover_notes?: string | null;
  decision?: "approved" | "refused" | "withdrawn" | null;
  decision_at?: string | null;
  decision_note?: string | null;
}
export interface NewDeliverableRow { case_id: string; original_name: string; storage_path: string; mime: CaseDeliverable["mime"]; size_bytes: number; uploaded_by: string | null }
export interface CasePaymentPatch {
  status?: CasePayment["status"];
  client_reference?: string | null;
  bank_reference?: string | null;
  received_amount_pkr?: number | null;
  verified_by?: string | null;
  verified_at?: string | null;
  provider?: string | null;
  provider_ref?: string | null;
  provider_price?: number | null;
  provider_currency?: string | null;
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
  /** Replaces any unused token of the same kind for this client. Only the sha256 hash is stored. */
  issueClientToken(clientId: string, kind: "verify" | "reset", tokenHash: string, expiresAt: Date): Promise<void>;
  /** Atomically marks a valid, unused, unexpired token used and returns its client id (null if invalid). */
  consumeClientToken(kind: "verify" | "reset", tokenHash: string): Promise<string | null>;
  setClientPassword(id: string, passwordHash: string): Promise<void>;
  markClientVerified(id: string): Promise<void>;

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
  insertDeliverable(row: NewDeliverableRow): Promise<CaseDeliverable>;
  getDeliverable(id: string): Promise<CaseDeliverable | null>;
  deleteDeliverable(id: string): Promise<void>;
  getCaseStats(): Promise<CaseStats>;

  getBookingIdByReference(reference: string): Promise<string | null>;
  /** Idempotency: true if newly recorded, false if (provider, event_id) was already seen. */
  recordPaymentEvent(row: NewPaymentEventRow): Promise<boolean>;

  getReport(): Promise<Report>;
  getStats(): Promise<Stats>;

  getAdminByEmail(email: string): Promise<AdminUser | null>;
  recordAdminLogin(id: string): Promise<void>;
  setAdminPassword(id: string, passwordHash: string): Promise<void>;

  // ── CMS ──
  listFaqs(opts?: { publishedOnly?: boolean }): Promise<Faq[]>;
  saveFaq(row: { id?: string; question: string; answer: string; sort_order?: number; is_published?: boolean }): Promise<Faq | null>;
  deleteFaq(id: string): Promise<void>;
  listLandingPages(): Promise<import("../types").LandingPageRow[]>;
  saveLandingPage(row: import("../types").LandingPageRow): Promise<import("../types").LandingPageRow>;
  deleteLandingPage(slug: string): Promise<void>;
  listWizardQuestions(opts?: { activeOnly?: boolean }): Promise<import("../types").WizardQuestion[]>;
  saveWizardQuestion(row: Omit<import("../types").WizardQuestion, "id"> & { id?: string }): Promise<import("../types").WizardQuestion | null>;
  deleteWizardQuestion(id: string): Promise<void>;
  listEmailTemplates(): Promise<import("../types").EmailTemplate[]>;
  saveEmailTemplate(key: import("../types").EmailTemplateKey, subject: string, body: string): Promise<void>;
  addNotification(n: { client_id: string; case_id: string | null; title: string; body: string; link: string | null }): Promise<void>;
  listNotifications(clientId: string, limit?: number): Promise<import("../types").ClientNotification[]>;
  markNotificationsRead(clientId: string): Promise<void>;
  listBlogPosts(opts?: { publishedOnly?: boolean; limit?: number }): Promise<BlogPost[]>;
  getBlogPost(key: { id?: string; slug?: string }, opts?: { publishedOnly?: boolean }): Promise<BlogPost | null>;
  saveBlogPost(row: { id?: string; slug: string; title: string; excerpt: string; body: string; meta_title: string | null; meta_description: string | null; is_published: boolean }): Promise<BlogPost>;
  deleteBlogPost(id: string): Promise<void>;

  // ── case messages ──
  listCaseMessages(caseId: string, opts: { includeInternal: boolean }): Promise<CaseMessage[]>;
  addCaseMessage(row: { case_id: string; sender: "client" | "staff"; sender_label: string; body: string; internal: boolean }): Promise<CaseMessage>;

  // ── data requests / team ──
  insertDataRequest(row: { client_id: string; kind: "export" | "delete"; note: string | null }): Promise<DataRequest>;
  listDataRequests(opts?: { status?: DataRequest["status"] }): Promise<(DataRequest & { client_email: string })[]>;
  setDataRequestStatus(id: string, status: "done" | "rejected"): Promise<DataRequest | null>;
  listAdmins(): Promise<AdminListRow[]>;
  getAdminById(id: string): Promise<AdminListRow | null>;
  updateAdmin(id: string, patch: { role?: Role; is_active?: boolean }): Promise<AdminListRow | null>;

  /** Raw admin-editable settings rows as key → JSON value. */
  getSettings(): Promise<Record<string, unknown>>;
  setSettings(values: Record<string, unknown>, updatedBy: string): Promise<void>;

  /** Returns true if the action is allowed, false if the limit is exceeded. */
  hitRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean>;
}
