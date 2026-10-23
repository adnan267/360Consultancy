import { randomUUID } from "node:crypto";
import { SEED_SCHOLARSHIPS } from "@/data/scholarships";
import { SEED_COUNTRIES, SEED_SERVICES } from "@/data/seed";
import type { Case, CaseDetail, CaseDocument, CaseListRow, CasePayment, CaseStage, CaseStatus, Client, DocStatus, AdminUser, AuditEntry, Lead, LeadStatus, Scholarship, ScholarshipFilter, Booking, BookingDetail, BookingFilter, BookingListRow, Country, Payment, Service } from "../types";
import type { ServicePatch } from "../validation";
import { DuplicateEmailError, DuplicateReferenceError, type CasePatch, type CasePaymentPatch, type CaseStats, type NewCaseRow, type NewClientRow, type NewDocumentRow, type NewBookingRow, type NewLeadRow, type NewPaymentEventRow, type Report, type PaymentPatch, type Repo, type Stats } from "./types";

/** In-memory repository: used by tests and for local UI work without Supabase. */
export class MemoryRepo implements Repo {
  services: Service[] = SEED_SERVICES.map((s) => ({ ...s }));
  countries: Country[] = SEED_COUNTRIES.map((c) => ({ ...c }));
  bookings: Booking[] = [];
  payments: Payment[] = [];
  audit: AuditEntry[] = [];
  admins: AdminUser[] = [];
  leads: Lead[] = [];
  scholarships: Scholarship[] = SEED_SCHOLARSHIPS.map((x) => ({ ...x }));
  paymentEvents: (NewPaymentEventRow & { created_at: string })[] = [];
  clients: Client[] = [];
  cases: Case[] = [];
  casePayments: CasePayment[] = [];
  documents: CaseDocument[] = [];
  private limits = new Map<string, { start: number; count: number }>();

  async listServices(opts?: { activeOnly?: boolean }) {
    return this.services.filter((s) => !opts?.activeOnly || s.is_active).sort((a, b) => a.sort_order - b.sort_order);
  }
  async getServiceBySlug(slug: string) {
    return this.services.find((s) => s.slug === slug) ?? null;
  }
  async updateService(id: string, patch: ServicePatch) {
    const s = this.services.find((x) => x.id === id);
    if (!s) return null;
    Object.assign(s, patch);
    return { ...s };
  }
  async listCountries(opts?: { activeOnly?: boolean }) {
    return this.countries.filter((c) => !opts?.activeOnly || c.is_active).sort((a, b) => a.sort_order - b.sort_order);
  }
  async getCountryBySlug(slug: string) {
    return this.countries.find((c) => c.slug === slug) ?? null;
  }

  async insertBooking(row: NewBookingRow) {
    if (this.bookings.some((b) => b.reference === row.reference)) throw new DuplicateReferenceError();
    const now = new Date().toISOString();
    const booking: Booking = {
      id: randomUUID(),
      ...row,
      currency: "PKR",
      status: "request_received",
      consent_privacy_at: now,
      consent_terms_at: now,
      delete_after: new Date(Date.now() + 2 * 365 * 86_400_000).toISOString().slice(0, 10),
      created_at: now,
      updated_at: now,
    };
    const payment: Payment = {
      id: randomUUID(),
      booking_id: booking.id,
      method: "bank_transfer",
      amount_pkr: row.fee_pkr,
      status: "awaiting",
      bank_reference: null,
      received_amount_pkr: null,
      verified_by: null,
      verified_at: null,
      created_at: now,
      updated_at: now,
    };
    this.bookings.push(booking);
    this.payments.push(payment);
    return { booking: { ...booking }, payment: { ...payment } };
  }

  async getBookingDetail(id: string): Promise<BookingDetail | null> {
    const booking = this.bookings.find((b) => b.id === id);
    if (!booking) return null;
    const payment = this.payments.find((p) => p.booking_id === id)!;
    const service = this.services.find((s) => s.id === booking.service_id)!;
    const country = this.countries.find((c) => c.id === booking.country_id)!;
    return {
      booking: { ...booking },
      payment: { ...payment },
      service: { id: service.id, slug: service.slug, title: service.title },
      country: { id: country.id, slug: country.slug, name: country.name },
      events: this.audit.filter((e) => e.booking_id === id),
    };
  }

  async listBookings(f: BookingFilter) {
    const q = f.q?.toLowerCase();
    const all: BookingListRow[] = this.bookings
      .map((b) => {
        const p = this.payments.find((x) => x.booking_id === b.id)!;
        return {
          id: b.id,
          reference: b.reference,
          full_name: b.full_name,
          email: b.email,
          status: b.status,
          payment_status: p.status,
          fee_pkr: b.fee_pkr,
          service_title: this.services.find((s) => s.id === b.service_id)!.title,
          country_name: this.countries.find((c) => c.id === b.country_id)!.name,
          preferred_at: b.preferred_at,
          created_at: b.created_at,
        };
      })
      .filter((r) => (!f.status || r.status === f.status) && (!f.paymentStatus || r.payment_status === f.paymentStatus))
      .filter((r) => !q || [r.reference, r.full_name, r.email].some((v) => v.toLowerCase().includes(q)))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return { rows: all.slice(f.offset, f.offset + f.limit), total: all.length };
  }

  async setBookingStatus(id: string, status: Booking["status"]) {
    const b = this.bookings.find((x) => x.id === id);
    if (b) {
      b.status = status;
      b.updated_at = new Date().toISOString();
    }
  }

  async updatePayment(paymentId: string, patch: PaymentPatch) {
    const p = this.payments.find((x) => x.id === paymentId)!;
    Object.assign(p, patch, { updated_at: new Date().toISOString() });
    return { ...p };
  }

  async appendAudit(entry: AuditEntry) {
    this.audit.push({ ...entry, id: randomUUID(), created_at: new Date().toISOString() });
  }
  async listAudit(opts?: { bookingId?: string; caseId?: string; limit?: number }) {
    return this.audit.filter((e) => (!opts?.bookingId || e.booking_id === opts.bookingId) && (!opts?.caseId || e.case_id === opts.caseId)).slice(-(opts?.limit ?? 100));
  }

  async insertLead(row: NewLeadRow) {
    const now = new Date().toISOString();
    const lead: Lead = {
      id: randomUUID(),
      ...row,
      status: "new",
      consent_privacy_at: now,
      delete_after: new Date(Date.now() + 2 * 365 * 86_400_000).toISOString().slice(0, 10),
      created_at: now,
    };
    this.leads.push(lead);
    return { ...lead };
  }
  async listLeads(o: { limit: number; offset: number }) {
    const all = [...this.leads].sort((a, b) => b.created_at.localeCompare(a.created_at));
    return { rows: all.slice(o.offset, o.offset + o.limit), total: all.length };
  }
  async setLeadStatus(id: string, status: LeadStatus) {
    const l = this.leads.find((x) => x.id === id);
    if (!l) return null;
    l.status = status;
    return { ...l };
  }

  async listScholarships(f: ScholarshipFilter) {
    const q = f.q?.toLowerCase();
    return this.scholarships
      .filter((s) => (f.publishedOnly ? s.is_published : true))
      .filter((s) => !f.country || s.country_slug === f.country)
      .filter((s) => !f.level || s.degree_levels.includes(f.level))
      .filter((s) => !f.funding || s.funding_type === f.funding)
      .filter((s) => !q || [s.name, s.provider, s.eligibility_summary].some((v) => v.toLowerCase().includes(q)))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  // ── client portal ──
  async createClientAccount(row: NewClientRow) {
    if (this.clients.some((c) => c.email.toLowerCase() === row.email.toLowerCase())) throw new DuplicateEmailError();
    const now = new Date().toISOString();
    const c: Client = { id: randomUUID(), ...row, is_active: true, consent_privacy_at: now, consent_terms_at: now, last_login_at: null, created_at: now };
    this.clients.push(c);
    return { ...c };
  }
  async getClientByEmail(email: string) {
    const c = this.clients.find((x) => x.email.toLowerCase() === email.toLowerCase());
    return c ? { ...c } : null;
  }
  async getClientById(id: string) {
    const c = this.clients.find((x) => x.id === id);
    return c ? { ...c } : null;
  }
  async recordClientLogin(id: string) {
    const c = this.clients.find((x) => x.id === id);
    if (c) c.last_login_at = new Date().toISOString();
  }

  async insertCase(row: NewCaseRow) {
    if (this.cases.some((c) => c.reference === row.reference)) throw new DuplicateReferenceError();
    const now = new Date().toISOString();
    const c: Case = {
      id: randomUUID(), reference: row.reference, client_id: row.client_id, country_id: row.country_id, purpose: row.purpose,
      status: "awaiting_intake_payment", submission_quote_pkr: null, review_report: null, review_completed_at: null,
      submission_reference: null, submission_notes: null, submitted_at: null,
      delete_after: new Date(Date.now() + 2 * 365 * 86_400_000).toISOString().slice(0, 10), created_at: now, updated_at: now,
    };
    this.cases.push(c);
    await this.insertCasePayment({ case_id: c.id, stage: "intake", amount_pkr: row.intake_amount_pkr });
    return (await this.getCaseDetail(c.id))!;
  }
  async getCaseDetail(id: string): Promise<CaseDetail | null> {
    const c = this.cases.find((x) => x.id === id);
    if (!c) return null;
    const client = this.clients.find((x) => x.id === c.client_id)!;
    const country = this.countries.find((x) => x.id === c.country_id)!;
    return {
      case: { ...c },
      client: { id: client.id, email: client.email, full_name: client.full_name, phone: client.phone },
      country: { id: country.id, slug: country.slug, name: country.name },
      payments: this.casePayments.filter((p) => p.case_id === id).map((p) => ({ ...p })),
      documents: this.documents.filter((d) => d.case_id === id).map((d) => ({ ...d })),
      events: await this.listAudit({ caseId: id, limit: 300 }),
    };
  }
  private row(c: Case): CaseListRow {
    const client = this.clients.find((x) => x.id === c.client_id)!;
    return { id: c.id, reference: c.reference, client_name: client.full_name, client_email: client.email, country_name: this.countries.find((x) => x.id === c.country_id)!.name, purpose: c.purpose, status: c.status, created_at: c.created_at };
  }
  async listCasesForClient(clientId: string) {
    return this.cases.filter((c) => c.client_id === clientId).sort((a, b) => b.created_at.localeCompare(a.created_at)).map((c) => this.row(c));
  }
  async listCases(f: { status?: CaseStatus; q?: string; limit: number; offset: number }) {
    const q = f.q?.toLowerCase();
    const all = this.cases.map((c) => this.row(c)).filter((r) => (!f.status || r.status === f.status) && (!q || [r.reference, r.client_name, r.client_email].some((v) => v.toLowerCase().includes(q)))).sort((a, b) => b.created_at.localeCompare(a.created_at));
    return { rows: all.slice(f.offset, f.offset + f.limit), total: all.length };
  }
  async updateCase(id: string, patch: CasePatch, expectStatus: CaseStatus) {
    const c = this.cases.find((x) => x.id === id);
    if (!c || c.status !== expectStatus) return false;
    Object.assign(c, patch, { updated_at: new Date().toISOString() });
    return true;
  }
  async insertCasePayment(row: { case_id: string; stage: CaseStage; amount_pkr: number }) {
    if (this.casePayments.some((p) => p.case_id === row.case_id && p.stage === row.stage)) throw new Error("duplicate stage payment");
    const now = new Date().toISOString();
    const p: CasePayment = { id: randomUUID(), ...row, status: "awaiting", client_reference: null, bank_reference: null, received_amount_pkr: null, verified_by: null, verified_at: null, created_at: now, updated_at: now };
    this.casePayments.push(p);
    return { ...p };
  }
  async updateCasePayment(id: string, patch: CasePaymentPatch) {
    const p = this.casePayments.find((x) => x.id === id)!;
    Object.assign(p, patch, { updated_at: new Date().toISOString() });
    return { ...p };
  }
  async insertDocument(row: NewDocumentRow) {
    const d: CaseDocument = { id: randomUUID(), ...row, status: "uploaded", admin_note: null, uploaded_at: new Date().toISOString() };
    this.documents.push(d);
    return { ...d };
  }
  async getDocument(id: string) {
    const d = this.documents.find((x) => x.id === id);
    return d ? { ...d } : null;
  }
  async updateDocument(id: string, patch: { status?: DocStatus; admin_note?: string | null }) {
    const d = this.documents.find((x) => x.id === id);
    if (!d) return null;
    Object.assign(d, patch);
    return { ...d };
  }
  async deleteDocument(id: string) {
    this.documents = this.documents.filter((x) => x.id !== id);
  }
  async getCaseStats(): Promise<CaseStats> {
    const byStatus: Record<string, number> = {};
    for (const c of this.cases) byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;
    return {
      byStatus,
      paymentsToVerify: this.casePayments.filter((p) => p.status === "under_review").length,
      docsToReview: this.documents.filter((d) => d.status === "uploaded" && this.cases.find((c) => c.id === d.case_id)?.status === "in_review").length,
    };
  }

  async getBookingIdByReference(reference: string) {
    return this.bookings.find((b) => b.reference === reference)?.id ?? null;
  }
  async recordPaymentEvent(row: NewPaymentEventRow) {
    if (this.paymentEvents.some((e) => e.provider === row.provider && e.event_id === row.event_id)) return false;
    this.paymentEvents.push({ ...row, created_at: new Date().toISOString() });
    return true;
  }

  async getReport(): Promise<Report> {
    const tally = <T extends string>(keys: T[]) => { const m = new Map<T, number>(); for (const k of keys) m.set(k, (m.get(k) ?? 0) + 1); return [...m].sort((a, b) => b[1] - a[1]); };
    const byCountry = tally(this.bookings.map((b) => this.countries.find((c) => c.id === b.country_id)?.name ?? "?")).map(([name, count]) => ({ name, count }));
    const byService = tally(this.bookings.map((b) => this.services.find((s) => s.id === b.service_id)?.title ?? "?")).map(([title, count]) => ({ title, count }));
    const months = new Map<string, { amountPkr: number; count: number }>();
    for (const p of this.payments) {
      if (p.status !== "verified" || !p.verified_at) continue;
      const k = p.verified_at.slice(0, 7);
      const cur = months.get(k) ?? { amountPkr: 0, count: 0 };
      cur.amountPkr += p.received_amount_pkr ?? 0; cur.count++;
      months.set(k, cur);
    }
    return { byCountry, byService, verifiedByMonth: [...months].sort((a, b) => b[0].localeCompare(a[0])).map(([month, v]) => ({ month, ...v })) };
  }

  async getStats(): Promise<Stats> {
    const byStatus: Record<string, number> = {};
    for (const b of this.bookings) byStatus[b.status] = (byStatus[b.status] ?? 0) + 1;
    const verified = this.payments.filter((p) => p.status === "verified").reduce((n, p) => n + (p.received_amount_pkr ?? 0), 0);
    const pending = this.payments.filter((p) => p.status === "awaiting" || p.status === "under_review").reduce((n, p) => n + p.amount_pkr, 0);
    const cutoff = Date.now() - 30 * 86_400_000;
    return {
      totalBookings: this.bookings.length,
      byStatus,
      verifiedRevenuePkr: verified,
      pendingRevenuePkr: pending,
      last30DaysBookings: this.bookings.filter((b) => new Date(b.created_at).getTime() >= cutoff).length,
    };
  }

  async getAdminByEmail(email: string) {
    return this.admins.find((a) => a.email.toLowerCase() === email.toLowerCase()) ?? null;
  }
  async recordAdminLogin() {}
  async setAdminPassword(id: string, passwordHash: string) {
    const a = this.admins.find((x) => x.id === id);
    if (a) a.password_hash = passwordHash;
  }

  async hitRateLimit(key: string, limit: number, windowSeconds: number) {
    const now = Date.now();
    const cur = this.limits.get(key);
    if (!cur || now - cur.start > windowSeconds * 1000) {
      this.limits.set(key, { start: now, count: 1 });
      return true;
    }
    cur.count += 1;
    return cur.count <= limit;
  }
}
