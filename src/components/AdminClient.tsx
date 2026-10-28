"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { BOOKING_STATUS_LABEL, LEAD_STATUSES, ROLE_LABEL, type BookingStatus, type LeadStatus, type PaymentStatus, type Role } from "@/lib/types";
import { BOOKING_TRANSITIONS } from "@/lib/status";
import { Button, Notice } from "./ui";

const input = "block w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm focus:border-navy-700 focus:outline-none focus:ring-2 focus:ring-gold-500/60";

async function call(url: string, method: string, body?: unknown): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const data = await res.json().catch(() => ({}));
    return res.ok ? { ok: true } : { ok: false, error: data?.error ?? `Request failed (${res.status})` };
  } catch {
    return { ok: false, error: "Network error" };
  }
}

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="rounded-lg px-3 py-2 text-sm font-semibold text-navy-100 hover:bg-white/10 hover:text-white"
      onClick={async () => { await call("/api/admin/logout", "POST"); router.replace("/admin/login"); router.refresh(); }}
    >
      Sign out
    </button>
  );
}

export function ChangePasswordForm() {
  const [msg, setMsg] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        if (fd.get("new_password") !== fd.get("confirm")) { setMsg({ tone: "error", text: "New passwords do not match" }); return; }
        setBusy(true); setMsg(null);
        const r = await call("/api/admin/password", "POST", { current_password: fd.get("current_password"), new_password: fd.get("new_password") });
        setBusy(false);
        if (r.ok) { form.reset(); setMsg({ tone: "success", text: "Password changed. Use the new password next time you sign in." }); } else setMsg({ tone: "error", text: r.error ?? "Failed" });
      }}
    >
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      <div><label htmlFor="cp" className="mb-1 block text-sm font-semibold">Current password</label><input id="cp" name="current_password" type="password" autoComplete="current-password" required className={input} /></div>
      <div><label htmlFor="np" className="mb-1 block text-sm font-semibold">New password</label><input id="np" name="new_password" type="password" autoComplete="new-password" minLength={12} required className={input} /></div>
      <div><label htmlFor="cf" className="mb-1 block text-sm font-semibold">Confirm new password</label><input id="cf" name="confirm" type="password" autoComplete="new-password" minLength={12} required className={input} /></div>
      <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Change password"}</Button>
    </form>
  );
}

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true); setError(null);
        const fd = new FormData(e.currentTarget);
        const r = await call("/api/admin/login", "POST", { email: fd.get("email"), password: fd.get("password") });
        setBusy(false);
        if (r.ok) { router.replace("/admin"); router.refresh(); } else setError(r.error ?? "Sign-in failed");
      }}
    >
      {error && <Notice tone="error">{error}</Notice>}
      <div><label htmlFor="email" className="mb-1 block text-sm font-semibold">Email</label><input id="email" name="email" type="email" autoComplete="username" required className={input} /></div>
      <div><label htmlFor="password" className="mb-1 block text-sm font-semibold">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required className={input} /></div>
      <Button type="submit" disabled={busy} className="w-full">{busy ? "Signing in…" : "Sign in"}</Button>
    </form>
  );
}

export function BookingActions(props: { id: string; status: BookingStatus; paymentStatus: PaymentStatus; amountPkr: number; bankReference: string | null; role: Role }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const isAdmin = props.role === "admin";

  async function act(body: unknown, okText: string) {
    setBusy(true); setMsg(null);
    const r = await call(`/api/admin/bookings/${props.id}`, "PATCH", body);
    setBusy(false);
    if (r.ok) { setMsg({ tone: "success", text: okText }); router.refresh(); } else setMsg({ tone: "error", text: r.error ?? "Failed" });
  }

  // These transitions are driven by recording / rejecting the payment, so they are not offered as plain buttons.
  const next = BOOKING_TRANSITIONS[props.status].filter((s) => s !== "payment_under_review" && !(props.status === "payment_under_review" && s === "awaiting_payment"));

  return (
    <div className="space-y-6">
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}

      <section aria-labelledby="st">
        <h3 id="st" className="font-bold text-navy-900">Booking status</h3>
        {next.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {next.map((s) => (
              <Button
                key={s}
                variant={s === "cancelled" ? "secondary" : "dark"}
                disabled={busy}
                onClick={() => {
                  if (s === "cancelled" && !confirm("Cancel this booking?")) return;
                  void act({ action: "set_status", status: s }, `Status set to ${BOOKING_STATUS_LABEL[s]}`);
                }}
              >
                {s === "awaiting_payment" ? "Accept & request payment" : `Mark ${BOOKING_STATUS_LABEL[s].toLowerCase()}`}
              </Button>
            ))}
          </div>
        ) : <p className="mt-2 text-sm text-muted">No further status changes are possible.</p>}
        {props.status === "awaiting_payment" && <p className="mt-2 text-xs text-muted">Accepting sends payment instructions by email if an email provider is configured; otherwise copy the details to the customer manually.</p>}
      </section>

      <section aria-labelledby="pay">
        <h3 id="pay" className="font-bold text-navy-900">Payment (bank transfer)</h3>
        <p className="mt-1 text-sm text-muted">Amount due: PKR {props.amountPkr.toLocaleString("en-PK")}. Verify only against the actual bank account record — never a screenshot alone.</p>

        {props.paymentStatus === "awaiting" && props.status === "awaiting_payment" && (
          <form className="mt-3 flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); const ref = String(fd.get("ref") ?? "").trim(); void act({ action: "update_payment", status: "under_review", ...(ref ? { bankReference: ref } : {}) }, "Payment marked under review"); }}>
            <div className="min-w-48 flex-1"><label className="mb-1 block text-xs font-semibold">Customer-quoted reference (optional)</label><input name="ref" className={input} maxLength={100} /></div>
            <Button type="submit" disabled={busy} variant="dark">Customer says they paid → under review</Button>
          </form>
        )}

        {(props.paymentStatus === "under_review") && isAdmin && (
          <div className="mt-3 grid gap-4 lg:grid-cols-2">
            <form className="space-y-2 rounded-xl border border-line bg-white p-4" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); void act({ action: "update_payment", status: "verified", bankReference: String(fd.get("ref")), receivedAmountPkr: Number(fd.get("amount")) }, "Payment verified"); }}>
              <p className="text-sm font-semibold">Verify from bank record</p>
              <div><label className="mb-1 block text-xs font-semibold">Bank transaction reference</label><input name="ref" required minLength={3} maxLength={100} defaultValue={props.bankReference ?? ""} className={input} /></div>
              <div><label className="mb-1 block text-xs font-semibold">Amount actually received (PKR)</label><input name="amount" type="number" required min={0} step={1} className={input} /></div>
              <Button type="submit" disabled={busy}>Verify payment</Button>
            </form>
            <form className="space-y-2 rounded-xl border border-line bg-white p-4" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); void act({ action: "update_payment", status: "rejected", note: String(fd.get("note")) }, "Payment rejected"); }}>
              <p className="text-sm font-semibold">Not found / wrong amount</p>
              <div><label className="mb-1 block text-xs font-semibold">Reason (required)</label><input name="note" required maxLength={2000} className={input} /></div>
              <Button type="submit" variant="secondary" disabled={busy}>Reject payment</Button>
            </form>
          </div>
        )}
        {props.paymentStatus === "under_review" && !isAdmin && <p className="mt-2 text-sm text-muted">Only an administrator can verify or reject payments.</p>}

        {props.paymentStatus === "rejected" && props.status === "awaiting_payment" && (
          <Button className="mt-3" variant="dark" disabled={busy} onClick={() => void act({ action: "update_payment", status: "under_review" }, "Payment back under review")}>Re-open payment review</Button>
        )}

        {props.paymentStatus === "verified" && props.status === "cancelled" && isAdmin && (
          <Button className="mt-3" variant="secondary" disabled={busy} onClick={() => { if (confirm("Record that this payment has been refunded?")) void act({ action: "update_payment", status: "refunded" }, "Refund recorded"); }}>Record refund</Button>
        )}
      </section>

      <section aria-labelledby="notes">
        <h3 id="notes" className="font-bold text-navy-900">Add internal note</h3>
        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); const form = e.currentTarget; const fd = new FormData(form); void act({ action: "add_note", note: String(fd.get("note")) }, "Note added").then(() => form.reset()); }}>
          <input name="note" required maxLength={2000} aria-label="Internal note" className={input} placeholder="Visible to staff only" />
          <Button type="submit" disabled={busy} variant="dark">Add</Button>
        </form>
      </section>
    </div>
  );
}

export function ServiceEditor({ s }: { s: { id: string; title: string; slug: string; fee_pkr: number; fee_is_starting_price: boolean; fee_needs_review: boolean; is_active: boolean } }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="grid items-end gap-3 sm:grid-cols-[1fr_9rem_auto_auto_auto_auto]"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setBusy(true); setMsg(null); setErr(null);
        const r = await call(`/api/admin/services/${s.id}`, "PATCH", {
          fee_pkr: Number(fd.get("fee")),
          fee_is_starting_price: fd.get("starting") === "on",
          fee_needs_review: fd.get("review") === "on",
          is_active: fd.get("active") === "on",
        });
        setBusy(false);
        if (r.ok) { setMsg("Saved"); router.refresh(); } else setErr(r.error ?? "Failed");
      }}
    >
      <div><p className="font-bold text-navy-900">{s.title}</p><p className="text-xs text-muted">{s.slug}</p></div>
      <div><label className="mb-1 block text-xs font-semibold">Fee (PKR)</label><input name="fee" type="number" min={0} step={1} required defaultValue={s.fee_pkr} className={input} /></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="starting" defaultChecked={s.fee_is_starting_price} className="size-4 accent-navy-800" />From price</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="review" defaultChecked={s.fee_needs_review} className="size-4 accent-navy-800" />Needs review</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={s.is_active} className="size-4 accent-navy-800" />Active</label>
      <div className="flex items-center gap-2"><Button type="submit" disabled={busy} variant="dark">Save</Button>{msg && <span className="text-sm font-semibold text-emerald-700">{msg}</span>}{err && <span className="text-sm font-semibold text-red-700">{err}</span>}</div>
    </form>
  );
}

export function LeadStatusSelect({ id, status }: { id: string; status: LeadStatus }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  return (
    <div>
      <select
        aria-label="Lead status"
        defaultValue={status}
        className="rounded-lg border border-navy-200 bg-white px-2 py-1 text-sm"
        onChange={async (e) => {
          setErr(null);
          const r = await call(`/api/admin/leads/${id}`, "PATCH", { status: e.target.value });
          if (r.ok) router.refresh(); else setErr(r.error ?? "Failed");
        }}
      >
        {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      {err && <p className="text-xs font-semibold text-red-700">{err}</p>}
    </div>
  );
}

export function SettingsForm({ initial }: { initial: { seo_title: string; seo_description: string; mail_from: string; notify_emails: string[] } }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.seo_title);
  const [desc, setDesc] = useState(initial.seo_description);
  const [from, setFrom] = useState(initial.mail_from);
  const [emails, setEmails] = useState<string[]>(initial.notify_emails);
  const [draft, setDraft] = useState("");
  const [draftErr, setDraftErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  function addEmail() {
    const e = draft.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { setDraftErr("Enter a valid email address"); return; }
    if (emails.includes(e)) { setDraftErr("Already in the list"); return; }
    if (emails.length >= 10) { setDraftErr("Maximum 10 addresses"); return; }
    setEmails([...emails, e]); setDraft(""); setDraftErr(null);
  }

  return (
    <form
      className="space-y-8"
      onSubmit={async (ev) => {
        ev.preventDefault();
        setBusy(true); setMsg(null);
        const r = await call("/api/admin/settings", "PATCH", { seo_title: title, seo_description: desc, mail_from: from, notify_emails: emails });
        setBusy(false);
        if (r.ok) { setMsg({ tone: "success", text: "Saved. Changes appear on the website shortly." }); router.refresh(); } else setMsg({ tone: "error", text: r.error ?? "Failed" });
      }}
    >
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}

      <section className="space-y-4 rounded-2xl border border-navy-100 bg-white p-5">
        <h2 className="text-lg font-bold text-navy-900">Website SEO (meta)</h2>
        <div>
          <label htmlFor="seo_title" className="mb-1 block text-sm font-semibold">Meta title</label>
          <input id="seo_title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={70} required className={input} />
          <p className="mt-1 text-xs text-muted">{title.length}/70 characters. Shown in Google results and the browser tab (best under 60).</p>
        </div>
        <div>
          <label htmlFor="seo_desc" className="mb-1 block text-sm font-semibold">Meta description</label>
          <textarea id="seo_desc" value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={200} rows={3} required className={input} />
          <p className="mt-1 text-xs text-muted">{desc.length}/200 characters. The short summary under the title in search results (best 120–160).</p>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-navy-100 bg-white p-5">
        <h2 className="text-lg font-bold text-navy-900">Email</h2>
        <div>
          <label htmlFor="mail_from" className="mb-1 block text-sm font-semibold">Sending address (From)</label>
          <input id="mail_from" type="email" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="admin@360consultancy.pk" className={input} />
          <p className="mt-1 text-xs text-muted">Emails to customers are sent from this address. It must belong to a domain verified with your email provider. Leave empty to use the server default.</p>
        </div>
        <div>
          <p className="mb-1 block text-sm font-semibold">Receiving addresses (admin alerts)</p>
          <p className="mb-2 text-xs text-muted">These addresses get an email for every new booking, lead and client case.</p>
          {emails.length === 0 ? <p className="mb-2 text-sm text-muted">No addresses added.</p> : (
            <ul className="mb-3 space-y-2">
              {emails.map((e) => (
                <li key={e} className="flex items-center justify-between gap-3 rounded-lg border border-navy-100 bg-mist px-3 py-2 text-sm">
                  <span className="break-all">{e}</span>
                  <button type="button" onClick={() => setEmails(emails.filter((x) => x !== e))} className="shrink-0 font-semibold text-red-700 hover:underline" aria-label={`Remove ${e}`}>Remove</button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <input aria-label="New receiving email" type="email" value={draft} onChange={(e) => { setDraft(e.target.value); setDraftErr(null); }} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addEmail(); } }} placeholder="name@example.com" className={input} />
            <Button type="button" variant="dark" onClick={addEmail}>Add</Button>
          </div>
          {draftErr && <p className="mt-1 text-sm font-semibold text-red-700">{draftErr}</p>}
        </div>
      </section>

      <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save settings"}</Button>
    </form>
  );
}

/** Sidebar link with an active state. */
export function AdminNavLink({ href, children, exact }: { href: string; children: React.ReactNode; exact?: boolean }) {
  const path = usePathname();
  const active = exact ? path === href : path === href || path.startsWith(`${href}/`);
  return (
    <a
      href={href}
      aria-current={active ? "page" : undefined}
      className={`block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${active ? "bg-white/15 text-white" : "text-navy-100 hover:bg-white/10 hover:text-white"}`}
    >
      {children}
    </a>
  );
}

export function StaffMessageForm({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form className="mt-4 space-y-2" onSubmit={async (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const fd = new FormData(form);
      setBusy(true); setErr(null);
      const r = await call(`/api/admin/cases/${caseId}/messages`, "POST", { body: fd.get("body"), internal: fd.get("internal") === "on" });
      setBusy(false);
      if (r.ok) { form.reset(); router.refresh(); } else setErr(r.error ?? "Failed");
    }}>
      {err && <Notice tone="error">{err}</Notice>}
      <label htmlFor="staffmsg" className="sr-only">Message</label>
      <textarea id="staffmsg" name="body" required maxLength={2000} rows={3} className={input} placeholder="Write a message to the client, or tick “internal note” to keep it staff-only…" />
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="internal" className="size-4 accent-navy-800" />Internal note (client cannot see it)</label>
        <Button type="submit" variant="dark" disabled={busy}>{busy ? "Sending…" : "Send"}</Button>
      </div>
    </form>
  );
}

type FaqRow = { id: string; question: string; answer: string; sort_order: number; is_published: boolean };
export function FaqManager({ initial }: { initial: FaqRow[] }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  async function run(fn: () => Promise<{ ok: boolean; error?: string }>, ok = "Saved") {
    setBusy(true); setMsg(null);
    const r = await fn();
    setBusy(false);
    if (r.ok) { setMsg({ tone: "success", text: ok }); router.refresh(); } else setMsg({ tone: "error", text: r.error ?? "Failed" });
  }
  return (
    <div className="space-y-6">
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      {initial.length === 0 && (
        <Notice tone="info" title="Using the built-in FAQs">The website currently shows the default questions. <button type="button" disabled={busy} className="font-semibold underline" onClick={() => run(() => call("/api/admin/faqs", "POST", { seedDefaults: true }), "Default FAQs imported — you can now edit them.")}>Import them here to edit</button>.</Notice>
      )}
      <ul className="space-y-4">
        {initial.map((f) => (
          <li key={f.id} className="rounded-2xl border border-navy-100 bg-white p-4">
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); run(() => call(`/api/admin/faqs/${f.id}`, "PATCH", { question: fd.get("question"), answer: fd.get("answer"), sort_order: Number(fd.get("sort")), is_published: fd.get("pub") === "on" })); }}>
              <input name="question" defaultValue={f.question} required maxLength={300} aria-label="Question" className={input} />
              <textarea name="answer" defaultValue={f.answer} required maxLength={4000} rows={3} aria-label="Answer" className={input} />
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm">Order <input name="sort" type="number" min={0} defaultValue={f.sort_order} className={`${input} !w-24`} /></label>
                <label className="flex items-center gap-2 text-sm"><input name="pub" type="checkbox" defaultChecked={f.is_published} className="size-4 accent-navy-800" />Published</label>
                <Button type="submit" variant="dark" disabled={busy}>Save</Button>
                <button type="button" className="text-sm font-semibold text-red-700 hover:underline" onClick={() => { if (window.confirm("Delete this FAQ?")) run(() => call(`/api/admin/faqs/${f.id}`, "DELETE"), "Deleted"); }}>Delete</button>
              </div>
            </form>
          </li>
        ))}
      </ul>
      <form className="space-y-3 rounded-2xl border border-dashed border-navy-200 p-4" onSubmit={(e) => { e.preventDefault(); const form = e.currentTarget; const fd = new FormData(form); run(async () => { const r = await call("/api/admin/faqs", "POST", { question: fd.get("question"), answer: fd.get("answer"), sort_order: 100 }); if (r.ok) form.reset(); return r; }, "FAQ added"); }}>
        <h2 className="font-bold text-navy-900">Add a FAQ</h2>
        <input name="question" required maxLength={300} placeholder="Question" aria-label="New question" className={input} />
        <textarea name="answer" required maxLength={4000} rows={3} placeholder="Answer" aria-label="New answer" className={input} />
        <Button type="submit" disabled={busy}>Add FAQ</Button>
      </form>
    </div>
  );
}

export function NewLandingForm() {
  const router = useRouter();
  const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  return (
    <form className="flex flex-wrap items-end gap-3 rounded-2xl border border-dashed border-navy-200 p-4" onSubmit={(e) => { e.preventDefault(); const s = slugify(String(new FormData(e.currentTarget).get("slug") ?? "")); if (s) router.push(`/admin/landing-pages/${s}`); }}>
      <div className="min-w-56 flex-1"><label htmlFor="lp_new" className="mb-1 block text-sm font-semibold">Add a new landing page</label><input id="lp_new" name="slug" required maxLength={80} placeholder="e.g. uk-student-visa" className={input} /><p className="mt-1 text-xs text-muted">This becomes the URL: /lp/your-slug</p></div>
      <Button type="submit">Create</Button>
    </form>
  );
}

type LandingForm = { slug: string; purpose: "study" | "work" | "visit" | "unsure"; destination: string | null; title: string; headline: string; sub: string; bullets: string[]; faqs: { q: string; a: string }[]; service_slug: string | null; is_published: boolean };
export function LandingEditor({ page, hasDefault, saved, destinations, services }: { page: LandingForm; hasDefault: boolean; saved: boolean; destinations: { slug: string; name: string }[]; services: { slug: string; title: string }[] }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [faqs, setFaqs] = useState(page.faqs.length ? page.faqs : [{ q: "", a: "" }]);
  const setFaq = (i: number, k: "q" | "a", v: string) => setFaqs((f) => f.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const url = `/api/admin/landing-pages/${page.slug}`;
  return (
    <form className="space-y-5" onSubmit={async (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const body = {
        purpose: fd.get("purpose"), destination: (fd.get("destination") as string) || null, title: fd.get("title"), headline: fd.get("headline"), sub: fd.get("sub") || "",
        bullets: String(fd.get("bullets") ?? "").split("\n").map((b) => b.trim()).filter(Boolean),
        faqs: faqs.map((f) => ({ q: f.q.trim(), a: f.a.trim() })).filter((f) => f.q || f.a),
        service_slug: (fd.get("service") as string) || null, is_published: fd.get("pub") === "on",
      };
      setBusy(true); setMsg(null);
      const r = await call(url, "PUT", body);
      setBusy(false);
      if (r.ok) { setMsg({ tone: "success", text: "Saved. The live page updates within a few minutes." }); router.refresh(); } else setMsg({ tone: "error", text: r.error ?? "Failed" });
    }}>
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="lp_title" className="mb-1 block text-sm font-semibold">Page title <span className="font-normal text-muted">(browser tab)</span></label><input id="lp_title" name="title" required minLength={3} maxLength={120} defaultValue={page.title} className={input} /></div>
        <div><label htmlFor="lp_purpose" className="mb-1 block text-sm font-semibold">Visitor goal</label><select id="lp_purpose" name="purpose" defaultValue={page.purpose} className={input}><option value="study">Study</option><option value="work">Work</option><option value="visit">Visit</option><option value="unsure">Not sure / any</option></select></div>
      </div>
      <div><label htmlFor="lp_headline" className="mb-1 block text-sm font-semibold">Headline</label><input id="lp_headline" name="headline" required minLength={3} maxLength={160} defaultValue={page.headline} className={input} /></div>
      <div><label htmlFor="lp_sub" className="mb-1 block text-sm font-semibold">Text under the headline</label><textarea id="lp_sub" name="sub" maxLength={400} rows={3} defaultValue={page.sub} className={input} /></div>
      <div><label htmlFor="lp_bullets" className="mb-1 block text-sm font-semibold">Bullet points</label><textarea id="lp_bullets" name="bullets" rows={6} defaultValue={page.bullets.join("\n")} className={input} /><p className="mt-1 text-xs text-muted">One per line, up to 8.</p></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="lp_dest" className="mb-1 block text-sm font-semibold">Pre-select country <span className="font-normal text-muted">(optional)</span></label><select id="lp_dest" name="destination" defaultValue={page.destination ?? ""} className={input}><option value="">None</option>{destinations.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}</select></div>
        <div><label htmlFor="lp_service" className="mb-1 block text-sm font-semibold">Related service <span className="font-normal text-muted">(optional)</span></label><select id="lp_service" name="service" defaultValue={page.service_slug ?? ""} className={input}><option value="">None</option>{services.map((s) => <option key={s.slug} value={s.slug}>{s.title}</option>)}</select></div>
      </div>
      <fieldset className="space-y-3">
        <legend className="mb-1 text-sm font-semibold">FAQs <span className="font-normal text-muted">(up to 10)</span></legend>
        {faqs.map((f, i) => (
          <div key={i} className="space-y-2 rounded-xl border border-navy-100 bg-white p-3">
            <input value={f.q} onChange={(e) => setFaq(i, "q", e.target.value)} maxLength={300} placeholder="Question" aria-label={`Question ${i + 1}`} className={input} />
            <textarea value={f.a} onChange={(e) => setFaq(i, "a", e.target.value)} maxLength={1500} rows={2} placeholder="Answer" aria-label={`Answer ${i + 1}`} className={input} />
            <button type="button" className="text-xs font-semibold text-red-700 hover:underline" onClick={() => setFaqs((x) => x.filter((_, j) => j !== i))}>Remove</button>
          </div>
        ))}
        {faqs.length < 10 && <button type="button" className="text-sm font-semibold text-navy-700 hover:underline" onClick={() => setFaqs((x) => [...x, { q: "", a: "" }])}>+ Add FAQ</button>}
      </fieldset>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="pub" defaultChecked={page.is_published} className="size-4 accent-navy-800" />Published (untick to hide this page)</label>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
        {saved && <button type="button" disabled={busy} className="text-sm font-semibold text-red-700 hover:underline" onClick={async () => {
          if (!window.confirm(hasDefault ? "Discard your changes and go back to the default content?" : "Delete this landing page?")) return;
          const r = await call(url, "DELETE");
          if (!r.ok) { setMsg({ tone: "error", text: r.error ?? "Failed" }); return; }
          if (hasDefault) { window.location.reload(); } else { router.replace("/admin/landing-pages"); router.refresh(); }
        }}>{hasDefault ? "Reset to default" : "Delete page"}</button>}
      </div>
    </form>
  );
}

type PostForm = { id?: string; slug: string; title: string; excerpt: string; body: string; meta_title: string | null; meta_description: string | null; is_published: boolean };
export function BlogEditor({ post }: { post?: PostForm }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  return (
    <form className="max-w-3xl space-y-4" onSubmit={async (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const body = { slug: String(fd.get("slug") || ""), title: fd.get("title"), excerpt: fd.get("excerpt") || "", body: fd.get("body") || "", meta_title: (fd.get("meta_title") as string) || null, meta_description: (fd.get("meta_description") as string) || null, is_published: fd.get("pub") === "on" };
      setBusy(true); setMsg(null);
      try {
        const res = await fetch(post?.id ? `/api/admin/blog/${post.id}` : "/api/admin/blog", { method: post?.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) { setMsg({ tone: "error", text: data?.error ?? "Failed" }); }
        else if (!post?.id && data.id) { router.replace(`/admin/blog/${data.id}`); router.refresh(); }
        else { setMsg({ tone: "success", text: "Saved" }); router.refresh(); }
      } catch { setMsg({ tone: "error", text: "Network error" }); }
      setBusy(false);
    }}>
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      <div><label htmlFor="b_title" className="mb-1 block text-sm font-semibold">Title</label><input id="b_title" name="title" required minLength={3} maxLength={160} defaultValue={post?.title} className={input} onBlur={(e) => { const s = document.getElementById("b_slug") as HTMLInputElement | null; if (s && !s.value) s.value = slugify(e.target.value); }} /></div>
      <div><label htmlFor="b_slug" className="mb-1 block text-sm font-semibold">URL slug</label><input id="b_slug" name="slug" required pattern="[a-z0-9-]{1,80}" maxLength={80} defaultValue={post?.slug} className={input} /><p className="mt-1 text-xs text-muted">Appears as /blog/your-slug. Lowercase letters, numbers, hyphens.</p></div>
      <div><label htmlFor="b_excerpt" className="mb-1 block text-sm font-semibold">Short summary</label><textarea id="b_excerpt" name="excerpt" maxLength={300} rows={2} defaultValue={post?.excerpt} className={input} /></div>
      <div><label htmlFor="b_body" className="mb-1 block text-sm font-semibold">Article</label><textarea id="b_body" name="body" rows={16} maxLength={60000} defaultValue={post?.body} className={`${input} font-mono`} /><p className="mt-1 text-xs text-muted">Plain text. Start a line with “## ” for a heading and “- ” for a bullet. Blank line = new paragraph. Only link to official sources and state facts you have verified.</p></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="b_mt" className="mb-1 block text-sm font-semibold">SEO title <span className="font-normal text-muted">(optional)</span></label><input id="b_mt" name="meta_title" maxLength={70} defaultValue={post?.meta_title ?? ""} className={input} /></div>
        <div><label htmlFor="b_md" className="mb-1 block text-sm font-semibold">SEO description <span className="font-normal text-muted">(optional)</span></label><input id="b_md" name="meta_description" maxLength={200} defaultValue={post?.meta_description ?? ""} className={input} /></div>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="pub" defaultChecked={post?.is_published} className="size-4 accent-navy-800" />Published (visible on the website)</label>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
        {post?.id && <button type="button" className="text-sm font-semibold text-red-700 hover:underline" onClick={async () => { if (!window.confirm("Delete this post permanently?")) return; const r = await call(`/api/admin/blog/${post.id}`, "DELETE"); if (r.ok) { router.replace("/admin/blog"); router.refresh(); } else setMsg({ tone: "error", text: r.error ?? "Failed" }); }}>Delete post</button>}
      </div>
    </form>
  );
}

export function TeamRow({ a, isSelf }: { a: { id: string; email: string; role: string; is_active: boolean }; isSelf: boolean }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  async function patch(body: object) { setErr(null); const r = await call(`/api/admin/team/${a.id}`, "PATCH", body); if (r.ok) router.refresh(); else setErr(r.error ?? "Failed"); }
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <span className="text-sm"><span className="font-semibold">{a.email}</span>{isSelf && <span className="text-muted"> (you)</span>}{!a.is_active && <span className="ml-2 rounded bg-navy-100 px-2 py-0.5 text-xs">Deactivated</span>}{err && <span className="block text-xs font-semibold text-red-700">{err}</span>}</span>
      <span className="flex items-center gap-3">
        <select aria-label={`Role for ${a.email}`} defaultValue={a.role} className="rounded-lg border border-navy-200 bg-white px-2 py-1 text-sm" onChange={(e) => patch({ role: e.target.value })}>
          {Object.entries(ROLE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button type="button" className="text-sm font-semibold text-navy-700 hover:underline" onClick={() => patch({ is_active: !a.is_active })}>{a.is_active ? "Deactivate" : "Reactivate"}</button>
      </span>
    </li>
  );
}

export function DataRequestActions({ id }: { id: string }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  async function set(status: "done" | "rejected") { setErr(null); const r = await call(`/api/admin/data-requests/${id}`, "PATCH", { status }); if (r.ok) router.refresh(); else setErr(r.error ?? "Failed"); }
  return (
    <span className="flex items-center gap-3 text-sm">
      <button type="button" className="font-semibold text-emerald-700 hover:underline" onClick={() => set("done")}>Mark done</button>
      <button type="button" className="font-semibold text-red-700 hover:underline" onClick={() => set("rejected")}>Reject</button>
      {err && <span className="text-xs font-semibold text-red-700">{err}</span>}
    </span>
  );
}
