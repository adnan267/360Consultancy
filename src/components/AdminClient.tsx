"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BOOKING_STATUS_LABEL, LEAD_STATUSES, type BookingStatus, type LeadStatus, type PaymentStatus, type Role } from "@/lib/types";
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
