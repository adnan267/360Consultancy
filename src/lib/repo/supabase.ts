import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseConfig } from "../env";
import type { Case, CaseDetail, CaseDocument, CaseListRow, CasePayment, CaseStage, CaseStatus, Client, DocStatus, AdminUser, AuditEntry, Lead, LeadStatus, Scholarship, ScholarshipFilter, Booking, BookingDetail, BookingFilter, BookingListRow, Country, Payment, Service } from "../types";
import type { ServicePatch } from "../validation";
import { DuplicateEmailError, DuplicateReferenceError, type CasePatch, type CasePaymentPatch, type CaseStats, type NewCaseRow, type NewClientRow, type NewDocumentRow, type NewBookingRow, type NewLeadRow, type NewPaymentEventRow, type Report, type PaymentPatch, type Repo, type Stats } from "./types";

let client: SupabaseClient | null = null;
function db(): SupabaseClient {
  if (client) return client;
  const cfg = supabaseConfig();
  if (!cfg) throw new Error("Supabase is not configured");
  // Service-role client: SERVER ONLY. Never import this module from a client component.
  client = createClient(cfg.url, cfg.serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

export { db as serviceDb };

function fail(error: { message: string } | null, what: string): asserts error is null {
  if (error) {
    console.error(`[supabase] ${what}:`, error.message);
    throw new Error(`Database error: ${what}${process.env.DIAG_ERRORS === "1" ? ` (${error.message.slice(0, 120)})` : ""}`);
  }
}

/** Strip characters that have meaning in PostgREST filter syntax. */
function safeSearch(q: string): string {
  return q.replace(/[^A-Za-z0-9@.\-+ ]/g, "").trim();
}

const one = <T>(v: T | T[] | null | undefined): T | undefined => (Array.isArray(v) ? v[0] : (v ?? undefined));

export class SupabaseRepo implements Repo {
  async listServices(opts?: { activeOnly?: boolean }) {
    let q = db().from("services").select("*").order("sort_order");
    if (opts?.activeOnly) q = q.eq("is_active", true);
    const { data, error } = await q;
    fail(error, "listServices");
    return (data ?? []) as Service[];
  }
  async getServiceBySlug(slug: string) {
    const { data, error } = await db().from("services").select("*").eq("slug", slug).maybeSingle();
    fail(error, "getServiceBySlug");
    return (data as Service | null) ?? null;
  }
  async updateService(id: string, patch: ServicePatch) {
    const { data, error } = await db().from("services").update(patch).eq("id", id).select("*").maybeSingle();
    fail(error, "updateService");
    return (data as Service | null) ?? null;
  }

  async listCountries(opts?: { activeOnly?: boolean }) {
    let q = db().from("countries").select("*").order("sort_order");
    if (opts?.activeOnly) q = q.eq("is_active", true);
    const { data, error } = await q;
    fail(error, "listCountries");
    return (data ?? []) as Country[];
  }
  async getCountryBySlug(slug: string) {
    const { data, error } = await db().from("countries").select("*").eq("slug", slug).maybeSingle();
    fail(error, "getCountryBySlug");
    return (data as Country | null) ?? null;
  }

  async insertBooking(row: NewBookingRow) {
    const now = new Date().toISOString();
    const { data: booking, error } = await db()
      .from("bookings")
      .insert({ ...row, consent_privacy_at: now, consent_terms_at: now })
      .select("*")
      .single();
    if (error?.code === "23505") throw new DuplicateReferenceError();
    fail(error, "insertBooking");
    const b = booking as Booking;
    const { data: payment, error: pErr } = await db()
      .from("payments")
      .insert({ booking_id: b.id, amount_pkr: row.fee_pkr })
      .select("*")
      .single();
    if (pErr) {
      // compensate: no booking without its payment record
      await db().from("bookings").delete().eq("id", b.id);
      fail(pErr, "insertPayment");
    }
    return { booking: b, payment: payment as Payment };
  }

  async getBookingDetail(id: string): Promise<BookingDetail | null> {
    const { data, error } = await db()
      .from("bookings")
      .select("*, payments(*), services(id,slug,title), countries(id,slug,name)")
      .eq("id", id)
      .maybeSingle();
    fail(error, "getBookingDetail");
    if (!data) return null;
    const { payments, services, countries, ...booking } = data as Record<string, unknown>;
    const events = await this.listAudit({ bookingId: id, limit: 200 });
    return {
      booking: booking as unknown as Booking,
      payment: one(payments as Payment | Payment[])!,
      service: one(services as BookingDetail["service"])!,
      country: one(countries as BookingDetail["country"])!,
      events,
    };
  }

  async listBookings(f: BookingFilter) {
    const paymentJoin = f.paymentStatus ? "payments!inner(status)" : "payments(status)";
    let q = db()
      .from("bookings")
      .select(`id,reference,full_name,email,status,fee_pkr,preferred_at,created_at,services(title),countries(name),${paymentJoin}`, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(f.offset, f.offset + f.limit - 1);
    if (f.status) q = q.eq("status", f.status);
    if (f.paymentStatus) q = q.eq("payments.status", f.paymentStatus);
    if (f.q) {
      const s = safeSearch(f.q);
      if (s) q = q.or(`reference.ilike.%${s}%,full_name.ilike.%${s}%,email.ilike.%${s}%`);
    }
    const { data, error, count } = await q;
    fail(error, "listBookings");
    const rows: BookingListRow[] = ((data ?? []) as unknown as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      reference: r.reference as string,
      full_name: r.full_name as string,
      email: r.email as string,
      status: r.status as BookingListRow["status"],
      payment_status: one(r.payments as { status: Payment["status"] } | { status: Payment["status"] }[])?.status ?? "awaiting",
      fee_pkr: r.fee_pkr as number,
      service_title: one(r.services as { title: string } | { title: string }[])?.title ?? "",
      country_name: one(r.countries as { name: string } | { name: string }[])?.name ?? "",
      preferred_at: r.preferred_at as string,
      created_at: r.created_at as string,
    }));
    return { rows, total: count ?? rows.length };
  }

  async setBookingStatus(id: string, status: Booking["status"]) {
    const { error } = await db().from("bookings").update({ status }).eq("id", id);
    fail(error, "setBookingStatus");
  }

  async updatePayment(paymentId: string, patch: PaymentPatch) {
    const { data, error } = await db().from("payments").update(patch).eq("id", paymentId).select("*").single();
    fail(error, "updatePayment");
    return data as Payment;
  }

  async appendAudit(entry: AuditEntry) {
    const { error } = await db().from("audit_logs").insert(entry);
    fail(error, "appendAudit");
  }
  async listAudit(opts?: { bookingId?: string; caseId?: string; limit?: number }) {
    let q = db().from("audit_logs").select("*").order("created_at", { ascending: false }).limit(opts?.limit ?? 100);
    if (opts?.bookingId) q = q.eq("booking_id", opts.bookingId);
    if (opts?.caseId) q = q.eq("case_id", opts.caseId);
    const { data, error } = await q;
    fail(error, "listAudit");
    return (data ?? []) as AuditEntry[];
  }

  async insertLead(row: NewLeadRow) {
    const { data, error } = await db().from("leads").insert(row).select("*").single();
    fail(error, "insertLead");
    return data as Lead;
  }
  async listLeads(o: { limit: number; offset: number }) {
    const { data, error, count } = await db().from("leads").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(o.offset, o.offset + o.limit - 1);
    fail(error, "listLeads");
    return { rows: (data ?? []) as Lead[], total: count ?? 0 };
  }
  async setLeadStatus(id: string, status: LeadStatus) {
    const { data, error } = await db().from("leads").update({ status }).eq("id", id).select("*").maybeSingle();
    fail(error, "setLeadStatus");
    return (data as Lead | null) ?? null;
  }

  async listScholarships(f: ScholarshipFilter) {
    let q = db().from("scholarships").select("*").order("name");
    if (f.publishedOnly) q = q.eq("is_published", true);
    if (f.country) q = q.eq("country_slug", f.country);
    if (f.level) q = q.contains("degree_levels", [f.level]);
    if (f.funding) q = q.eq("funding_type", f.funding);
    if (f.q) {
      const s = safeSearch(f.q);
      if (s) q = q.or(`name.ilike.%${s}%,provider.ilike.%${s}%,eligibility_summary.ilike.%${s}%`);
    }
    const { data, error } = await q;
    fail(error, "listScholarships");
    return (data ?? []) as Scholarship[];
  }

  // ── client portal ──
  async createClientAccount(row: NewClientRow) {
    const now = new Date().toISOString();
    const { data, error } = await db().from("clients").insert({ ...row, email: row.email.toLowerCase(), consent_privacy_at: now, consent_terms_at: now }).select("*").single();
    if (error?.code === "23505") throw new DuplicateEmailError();
    fail(error, "createClientAccount");
    return data as Client;
  }
  async getClientByEmail(email: string) {
    const { data, error } = await db().from("clients").select("*").ilike("email", email.replace(/[%_]/g, "")).maybeSingle();
    fail(error, "getClientByEmail");
    return (data as Client | null) ?? null;
  }
  async getClientById(id: string) {
    const { data, error } = await db().from("clients").select("*").eq("id", id).maybeSingle();
    fail(error, "getClientById");
    return (data as Client | null) ?? null;
  }
  async recordClientLogin(id: string) {
    await db().from("clients").update({ last_login_at: new Date().toISOString() }).eq("id", id);
  }

  async insertCase(row: NewCaseRow) {
    const { intake_amount_pkr, ...caseRow } = row;
    const { data, error } = await db().from("cases").insert(caseRow).select("*").single();
    if (error?.code === "23505") throw new DuplicateReferenceError();
    fail(error, "insertCase");
    const c = data as Case;
    const { error: pErr } = await db().from("case_payments").insert({ case_id: c.id, stage: "intake", amount_pkr: intake_amount_pkr });
    if (pErr) {
      await db().from("cases").delete().eq("id", c.id); // no case without its intake payment
      fail(pErr, "insertCasePayment");
    }
    return (await this.getCaseDetail(c.id))!;
  }
  async getCaseDetail(id: string): Promise<CaseDetail | null> {
    const { data, error } = await db().from("cases").select("*, clients(id,email,full_name,phone), countries(id,slug,name), case_payments(*), case_documents(*)").eq("id", id).maybeSingle();
    fail(error, "getCaseDetail");
    if (!data) return null;
    const { clients, countries, case_payments, case_documents, ...c } = data as Record<string, unknown>;
    const order = { intake: 0, review: 1, submission: 2 } as const;
    return {
      case: c as unknown as Case,
      client: one(clients as CaseDetail["client"] | CaseDetail["client"][])!,
      country: one(countries as CaseDetail["country"] | CaseDetail["country"][])!,
      payments: ((case_payments ?? []) as CasePayment[]).sort((a, b) => order[a.stage] - order[b.stage]),
      documents: ((case_documents ?? []) as CaseDocument[]).sort((a, b) => a.uploaded_at.localeCompare(b.uploaded_at)),
      events: await this.listAudit({ caseId: id, limit: 300 }),
    };
  }
  private toRow(r: Record<string, unknown>): CaseListRow {
    const cl = one(r.clients as { full_name: string; email: string } | { full_name: string; email: string }[]);
    return {
      id: r.id as string, reference: r.reference as string, client_name: cl?.full_name ?? "", client_email: cl?.email ?? "",
      country_name: one(r.countries as { name: string } | { name: string }[])?.name ?? "", purpose: r.purpose as CaseListRow["purpose"], status: r.status as CaseStatus, created_at: r.created_at as string,
    };
  }
  async listCasesForClient(clientId: string) {
    const { data, error } = await db().from("cases").select("id,reference,purpose,status,created_at,clients(full_name,email),countries(name)").eq("client_id", clientId).order("created_at", { ascending: false });
    fail(error, "listCasesForClient");
    return ((data ?? []) as unknown as Record<string, unknown>[]).map((r) => this.toRow(r));
  }
  async listCases(f: { status?: CaseStatus; q?: string; limit: number; offset: number }) {
    let q = db().from("cases").select("id,reference,purpose,status,created_at,clients!inner(full_name,email),countries(name)", { count: "exact" }).order("created_at", { ascending: false }).range(f.offset, f.offset + f.limit - 1);
    if (f.status) q = q.eq("status", f.status);
    if (f.q) {
      const s = safeSearch(f.q);
      if (s) q = q.or(`reference.ilike.%${s}%`);
    }
    const { data, error, count } = await q;
    fail(error, "listCases");
    const rows = ((data ?? []) as unknown as Record<string, unknown>[]).map((r) => this.toRow(r));
    return { rows, total: count ?? rows.length };
  }
  async updateCase(id: string, patch: CasePatch, expectStatus: CaseStatus) {
    const { data, error } = await db().from("cases").update(patch).eq("id", id).eq("status", expectStatus).select("id");
    fail(error, "updateCase");
    return (data?.length ?? 0) === 1;
  }
  async insertCasePayment(row: { case_id: string; stage: CaseStage; amount_pkr: number }) {
    const { data, error } = await db().from("case_payments").insert(row).select("*").single();
    fail(error, "insertCasePayment");
    return data as CasePayment;
  }
  async updateCasePayment(id: string, patch: CasePaymentPatch) {
    const { data, error } = await db().from("case_payments").update(patch).eq("id", id).select("*").single();
    fail(error, "updateCasePayment");
    return data as CasePayment;
  }
  async insertDocument(row: NewDocumentRow) {
    const { data, error } = await db().from("case_documents").insert(row).select("*").single();
    fail(error, "insertDocument");
    return data as CaseDocument;
  }
  async getDocument(id: string) {
    const { data, error } = await db().from("case_documents").select("*").eq("id", id).maybeSingle();
    fail(error, "getDocument");
    return (data as CaseDocument | null) ?? null;
  }
  async updateDocument(id: string, patch: { status?: DocStatus; admin_note?: string | null }) {
    const { data, error } = await db().from("case_documents").update(patch).eq("id", id).select("*").maybeSingle();
    fail(error, "updateDocument");
    return (data as CaseDocument | null) ?? null;
  }
  async deleteDocument(id: string) {
    const { error } = await db().from("case_documents").delete().eq("id", id);
    fail(error, "deleteDocument");
  }
  async getCaseStats(): Promise<CaseStats> {
    const [c, p, d] = await Promise.all([
      db().from("cases").select("status"),
      db().from("case_payments").select("id", { count: "exact", head: true }).eq("status", "under_review"),
      db().from("case_documents").select("id, cases!inner(status)", { count: "exact", head: true }).eq("status", "uploaded").eq("cases.status", "in_review"),
    ]);
    fail(c.error, "caseStats.cases");
    fail(p.error, "caseStats.payments");
    fail(d.error, "caseStats.docs");
    const byStatus: Record<string, number> = {};
    for (const r of c.data ?? []) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
    return { byStatus, paymentsToVerify: p.count ?? 0, docsToReview: d.count ?? 0 };
  }

  async getBookingIdByReference(reference: string) {
    const { data, error } = await db().from("bookings").select("id").eq("reference", reference).maybeSingle();
    fail(error, "getBookingIdByReference");
    return (data?.id as string | undefined) ?? null;
  }
  async recordPaymentEvent(row: NewPaymentEventRow) {
    const { error } = await db().from("payment_events").insert(row);
    if (error?.code === "23505") return false;
    fail(error, "recordPaymentEvent");
    return true;
  }

  async getReport(): Promise<Report> {
    const [b, p] = await Promise.all([
      db().from("bookings").select("services(title),countries(name)"),
      db().from("payments").select("received_amount_pkr,verified_at").eq("status", "verified"),
    ]);
    fail(b.error, "report.bookings");
    fail(p.error, "report.payments");
    const tally = (keys: string[]) => { const m = new Map<string, number>(); for (const k of keys) m.set(k, (m.get(k) ?? 0) + 1); return [...m].sort((a, c) => c[1] - a[1]); };
    const rows = (b.data ?? []) as unknown as { services: { title: string } | { title: string }[] | null; countries: { name: string } | { name: string }[] | null }[];
    const byCountry = tally(rows.map((r) => one(r.countries)?.name ?? "?")).map(([name, count]) => ({ name, count }));
    const byService = tally(rows.map((r) => one(r.services)?.title ?? "?")).map(([title, count]) => ({ title, count }));
    const months = new Map<string, { amountPkr: number; count: number }>();
    for (const r of p.data ?? []) {
      if (!r.verified_at) continue;
      const k = String(r.verified_at).slice(0, 7);
      const cur = months.get(k) ?? { amountPkr: 0, count: 0 };
      cur.amountPkr += r.received_amount_pkr ?? 0; cur.count++;
      months.set(k, cur);
    }
    return { byCountry, byService, verifiedByMonth: [...months].sort((a, c) => c[0].localeCompare(a[0])).map(([month, v]) => ({ month, ...v })) };
  }

  async getStats(): Promise<Stats> {
    const [b, p] = await Promise.all([
      db().from("bookings").select("status,created_at"),
      db().from("payments").select("status,amount_pkr,received_amount_pkr"),
    ]);
    fail(b.error, "stats.bookings");
    fail(p.error, "stats.payments");
    const byStatus: Record<string, number> = {};
    const cutoff = Date.now() - 30 * 86_400_000;
    let last30 = 0;
    for (const r of b.data ?? []) {
      byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
      if (new Date(r.created_at).getTime() >= cutoff) last30++;
    }
    let verified = 0;
    let pending = 0;
    for (const r of p.data ?? []) {
      if (r.status === "verified") verified += r.received_amount_pkr ?? 0;
      if (r.status === "awaiting" || r.status === "under_review") pending += r.amount_pkr;
    }
    return { totalBookings: b.data?.length ?? 0, byStatus, verifiedRevenuePkr: verified, pendingRevenuePkr: pending, last30DaysBookings: last30 };
  }

  async getAdminByEmail(email: string) {
    const { data, error } = await db().from("admin_users").select("id,email,password_hash,role,is_active").ilike("email", email).maybeSingle();
    fail(error, "getAdminByEmail");
    return (data as AdminUser | null) ?? null;
  }
  async setAdminPassword(id: string, passwordHash: string) {
    const { error } = await db().from("admin_users").update({ password_hash: passwordHash }).eq("id", id);
    fail(error, "setAdminPassword");
  }
  async recordAdminLogin(id: string) {
    await db().from("admin_users").update({ last_login_at: new Date().toISOString() }).eq("id", id);
  }

  async getSettings() {
    const { data, error } = await db().from("site_settings").select("key,value");
    fail(error, "getSettings");
    return Object.fromEntries((data ?? []).map((r: { key: string; value: unknown }) => [r.key, r.value]));
  }
  async setSettings(values: Record<string, unknown>, updatedBy: string) {
    const rows = Object.entries(values).map(([key, value]) => ({ key, value, updated_at: new Date().toISOString(), updated_by: updatedBy }));
    if (rows.length === 0) return;
    const { error } = await db().from("site_settings").upsert(rows, { onConflict: "key" });
    fail(error, "setSettings");
  }

  async hitRateLimit(key: string, limit: number, windowSeconds: number) {
    const { data, error } = await db().rpc("rate_limit_hit", { p_key: key, p_limit: limit, p_window_seconds: windowSeconds });
    if (error) {
      // Fail closed on abuse-sensitive paths: if the limiter is down, deny.
      console.error("[supabase] rate_limit_hit:", error.message);
      return false;
    }
    return data === true;
  }
}
