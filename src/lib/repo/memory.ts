import { randomUUID } from "node:crypto";
import { SEED_SCHOLARSHIPS } from "@/data/scholarships";
import { SEED_COUNTRIES, SEED_SERVICES } from "@/data/seed";
import type { Case, CaseDeliverable, CaseDetail, CaseDocument, CaseListRow, CasePayment, CaseStage, CaseStatus, Client, DocStatus, AdminUser, AuditEntry, Lead, LeadStatus, Scholarship, ScholarshipFilter, Booking, BookingDetail, BookingFilter, BookingListRow, Country, Payment, Service } from "../types";
import type { ServicePatch } from "../validation";
import { DuplicateEmailError, DuplicateReferenceError, type CasePatch, type CasePaymentPatch, type CaseStats, type NewCaseRow, type NewClientRow, type NewDeliverableRow, type NewDocumentRow, type NewBookingRow, type NewLeadRow, type NewPaymentEventRow, type Report, type PaymentPatch, type Repo, type Stats } from "./types";

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
  deliverables: CaseDeliverable[] = [];
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
      invoice_no: null,
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
    if (p.status === "verified" && !p.invoice_no) p.invoice_no = this.nextInvoiceNo();
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
    const c: Client = { id: randomUUID(), ...row, is_active: true, consent_privacy_at: now, consent_terms_at: now, last_login_at: null, email_verified_at: null, created_at: now };
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
      handover_at: null, handover_notes: null, decision: null, decision_at: null, decision_note: null,
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
      deliverables: this.deliverables.filter((d) => d.case_id === id).map((d) => ({ ...d })),
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
  async insertDeliverable(row: NewDeliverableRow) {
    const d: CaseDeliverable = { id: randomUUID(), ...row, uploaded_at: new Date().toISOString() };
    this.deliverables.push(d);
    return { ...d };
  }
  async getDeliverable(id: string) {
    const d = this.deliverables.find((x) => x.id === id);
    return d ? { ...d } : null;
  }
  async deleteDeliverable(id: string) {
    this.deliverables = this.deliverables.filter((x) => x.id !== id);
  }
  async insertCasePayment(row: { case_id: string; stage: CaseStage; amount_pkr: number }) {
    if (this.casePayments.some((p) => p.case_id === row.case_id && p.stage === row.stage)) throw new Error("duplicate stage payment");
    const now = new Date().toISOString();
    const p: CasePayment = { id: randomUUID(), ...row, status: "awaiting", client_reference: null, bank_reference: null, received_amount_pkr: null, verified_by: null, verified_at: null, invoice_no: null, provider: null, provider_ref: null, provider_price: null, provider_currency: null, created_at: now, updated_at: now };
    this.casePayments.push(p);
    return { ...p };
  }
  async updateCasePayment(id: string, patch: CasePaymentPatch) {
    const p = this.casePayments.find((x) => x.id === id)!;
    Object.assign(p, patch, { updated_at: new Date().toISOString() });
    if (p.status === "verified" && !p.invoice_no) p.invoice_no = this.nextInvoiceNo();
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

  private invoiceSeq = 0;
  /** Mirrors the database trigger that numbers invoices when a payment is verified. */
  nextInvoiceNo() { return `INV-${new Date().getFullYear()}-${String(++this.invoiceSeq).padStart(6, "0")}`; }
  clientTokens: { client_id: string; kind: string; hash: string; expires: number; used: boolean }[] = [];
  async issueClientToken(clientId: string, kind: "verify" | "reset", tokenHash: string, expiresAt: Date) {
    this.clientTokens = this.clientTokens.filter((t) => !(t.client_id === clientId && t.kind === kind && !t.used));
    this.clientTokens.push({ client_id: clientId, kind, hash: tokenHash, expires: expiresAt.getTime(), used: false });
  }
  async consumeClientToken(kind: "verify" | "reset", tokenHash: string) {
    const t = this.clientTokens.find((x) => x.kind === kind && x.hash === tokenHash && !x.used && x.expires > Date.now());
    if (!t) return null;
    t.used = true;
    return t.client_id;
  }
  async setClientPassword(id: string, passwordHash: string) {
    const c = this.clients.find((x) => x.id === id);
    if (c) c.password_hash = passwordHash;
  }
  async markClientVerified(id: string) {
    const c = this.clients.find((x) => x.id === id);
    if (c && !c.email_verified_at) c.email_verified_at = new Date().toISOString();
  }

  faqs: import("../types").Faq[] = [];
  posts: import("../types").BlogPost[] = [];
  messages: import("../types").CaseMessage[] = [];
  dataRequests: import("../types").DataRequest[] = [];
  async listFaqs(opts?: { publishedOnly?: boolean }) {
    return this.faqs.filter((f) => !opts?.publishedOnly || f.is_published).sort((a, b) => a.sort_order - b.sort_order).map((f) => ({ ...f }));
  }
  async saveFaq(row: { id?: string; question: string; answer: string; sort_order?: number; is_published?: boolean }) {
    const ex = row.id ? this.faqs.find((f) => f.id === row.id) : undefined;
    if (row.id && !ex) return null;
    if (ex) { Object.assign(ex, { ...row }); return { ...ex }; }
    const f = { id: randomUUID(), question: row.question, answer: row.answer, sort_order: row.sort_order ?? 100, is_published: row.is_published ?? true };
    this.faqs.push(f);
    return { ...f };
  }
  wizardQuestions: import("../types").WizardQuestion[] = [];
  emailTemplates: import("../types").EmailTemplate[] = [];
  notifications: import("../types").ClientNotification[] = [];
  async listWizardQuestions(opts?: { activeOnly?: boolean }) {
    return this.wizardQuestions.filter((q) => !opts?.activeOnly || q.is_active).sort((a, b) => a.sort_order - b.sort_order).map((q) => ({ ...q }));
  }
  async saveWizardQuestion(row: Omit<import("../types").WizardQuestion, "id"> & { id?: string }) {
    const ex = row.id ? this.wizardQuestions.find((q) => q.id === row.id) : undefined;
    if (ex) { Object.assign(ex, row); return { ...ex }; }
    if (row.id) return null;
    const q = { ...row, id: crypto.randomUUID() };
    this.wizardQuestions.push(q);
    return { ...q };
  }
  async deleteWizardQuestion(id: string) { this.wizardQuestions = this.wizardQuestions.filter((q) => q.id !== id); }
  async listEmailTemplates() { return this.emailTemplates.map((t) => ({ ...t })); }
  async saveEmailTemplate(key: import("../types").EmailTemplateKey, subject: string, body: string) {
    const ex = this.emailTemplates.find((t) => t.key === key);
    const updated_at = new Date().toISOString();
    if (ex) Object.assign(ex, { subject, body, updated_at }); else this.emailTemplates.push({ key, subject, body, updated_at });
  }
  async addNotification(n: { client_id: string; case_id: string | null; title: string; body: string; link: string | null }) {
    this.notifications.push({ ...n, id: crypto.randomUUID(), read_at: null, created_at: new Date().toISOString() });
  }
  async listNotifications(clientId: string, limit = 50) {
    return this.notifications.filter((n) => n.client_id === clientId).sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, limit).map((n) => ({ ...n }));
  }
  async markNotificationsRead(clientId: string) {
    for (const n of this.notifications) if (n.client_id === clientId && !n.read_at) n.read_at = new Date().toISOString();
  }
  async deleteFaq(id: string) { this.faqs = this.faqs.filter((f) => f.id !== id); }
  landingPages: import("../types").LandingPageRow[] = [];
  async listLandingPages() {
    return [...this.landingPages].sort((a, b) => a.slug.localeCompare(b.slug)).map((l) => structuredClone(l));
  }
  async saveLandingPage(row: import("../types").LandingPageRow) {
    const l = { ...structuredClone(row), updated_at: new Date().toISOString() };
    this.landingPages = [...this.landingPages.filter((x) => x.slug !== row.slug), l];
    return structuredClone(l);
  }
  async deleteLandingPage(slug: string) { this.landingPages = this.landingPages.filter((l) => l.slug !== slug); }
  async listBlogPosts(opts?: { publishedOnly?: boolean; limit?: number }) {
    return this.posts.filter((p) => !opts?.publishedOnly || p.is_published).sort((a, b) => (b.published_at ?? b.created_at).localeCompare(a.published_at ?? a.created_at)).slice(0, opts?.limit ?? 200).map((p) => ({ ...p }));
  }
  async getBlogPost(key: { id?: string; slug?: string }, opts?: { publishedOnly?: boolean }) {
    const p = this.posts.find((x) => (key.id ? x.id === key.id : x.slug === key.slug) && (!opts?.publishedOnly || x.is_published));
    return p ? { ...p } : null;
  }
  async saveBlogPost(row: { id?: string; slug: string; title: string; excerpt: string; body: string; meta_title: string | null; meta_description: string | null; is_published: boolean }) {
    const now = new Date().toISOString();
    if (this.posts.some((p) => p.slug === row.slug && p.id !== row.id)) throw new DuplicateReferenceError();
    const ex = row.id ? this.posts.find((p) => p.id === row.id) : undefined;
    if (ex) {
      const wasPublished = ex.is_published;
      Object.assign(ex, row, { updated_at: now, published_at: row.is_published ? (wasPublished ? ex.published_at : now) : ex.published_at });
      return { ...ex };
    }
    const p = { id: randomUUID(), ...row, published_at: row.is_published ? now : null, created_at: now, updated_at: now };
    this.posts.push(p);
    return { ...p };
  }
  async deleteBlogPost(id: string) { this.posts = this.posts.filter((p) => p.id !== id); }
  async listCaseMessages(caseId: string, opts: { includeInternal: boolean }) {
    return this.messages.filter((m) => m.case_id === caseId && (opts.includeInternal || !m.internal)).sort((a, b) => a.created_at.localeCompare(b.created_at)).map((m) => ({ ...m }));
  }
  async addCaseMessage(row: { case_id: string; sender: "client" | "staff"; sender_label: string; body: string; internal: boolean }) {
    const m = { id: randomUUID(), ...row, created_at: new Date().toISOString() };
    this.messages.push(m);
    return { ...m };
  }
  async insertDataRequest(row: { client_id: string; kind: "export" | "delete"; note: string | null }) {
    const r = { id: randomUUID(), ...row, status: "open" as const, created_at: new Date().toISOString(), handled_at: null };
    this.dataRequests.push(r);
    return { ...r };
  }
  async listDataRequests(opts?: { status?: "open" | "done" | "rejected" }) {
    return this.dataRequests.filter((r) => !opts?.status || r.status === opts.status).map((r) => ({ ...r, client_email: this.clients.find((c) => c.id === r.client_id)?.email ?? "" }));
  }
  async setDataRequestStatus(id: string, status: "done" | "rejected") {
    const r = this.dataRequests.find((x) => x.id === id);
    if (!r) return null;
    r.status = status; r.handled_at = new Date().toISOString();
    return { ...r };
  }
  async listAdmins() { return this.admins.map((a) => ({ id: a.id, email: a.email, role: a.role, is_active: a.is_active, last_login_at: null, created_at: "" })); }
  async getAdminById(id: string) { const a = (await this.listAdmins()).find((x) => x.id === id); return a ?? null; }
  async updateAdmin(id: string, patch: { role?: import("../types").Role; is_active?: boolean }) {
    const a = this.admins.find((x) => x.id === id);
    if (!a) return null;
    if (patch.role) a.role = patch.role;
    if (patch.is_active !== undefined) a.is_active = patch.is_active;
    return (await this.getAdminById(id));
  }

  settings: Record<string, unknown> = {};
  async getSettings() {
    return { ...this.settings };
  }
  async setSettings(values: Record<string, unknown>) {
    Object.assign(this.settings, values);
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
