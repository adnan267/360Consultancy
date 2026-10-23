"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DOC_TYPES, DOC_TYPE_LABEL, CASE_PURPOSES, type CaseStage } from "@/lib/types";
import { Button, Notice } from "./ui";

const input = "block w-full rounded-lg border border-navy-200 bg-white px-3 py-2.5 text-sm focus:border-navy-700 focus:outline-none focus:ring-2 focus:ring-gold-500/60";
type Res = { ok: boolean; error?: string; fields?: Record<string, string[]>; [k: string]: unknown };

async function send(url: string, method: string, body?: unknown): Promise<Res> {
  try {
    const res = await fetch(url, { method, headers: body instanceof FormData || body === undefined ? undefined : { "Content-Type": "application/json" }, body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    return res.ok ? { ok: true, ...data } : { ok: false, error: data?.error ?? `Request failed (${res.status})`, fields: data?.fields };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

export function PortalLogout() {
  const router = useRouter();
  return <button type="button" className="text-sm font-semibold text-navy-700 underline underline-offset-4" onClick={async () => { await send("/api/portal/logout", "POST"); router.replace("/portal/login"); router.refresh(); }}>Sign out</button>;
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string[]>>({});
  const [busy, setBusy] = useState(false);
  const reg = mode === "register";
  return (
    <form className="space-y-4" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true); setErr(null); setFields({});
      const fd = new FormData(e.currentTarget);
      const body = reg
        ? { fullName: fd.get("fullName"), email: fd.get("email"), phone: fd.get("phone") || "", password: fd.get("password"), consentPrivacy: fd.get("consentPrivacy") === "on", consentTerms: fd.get("consentTerms") === "on", website: fd.get("website") || "" }
        : { email: fd.get("email"), password: fd.get("password") };
      const r = await send(reg ? "/api/portal/register" : "/api/portal/login", "POST", body);
      setBusy(false);
      if (r.ok) { router.replace("/portal"); router.refresh(); } else { setErr(r.error ?? "Failed"); setFields(r.fields ?? {}); }
    }}>
      {err && <Notice tone="error">{err}</Notice>}
      {reg && <div><label htmlFor="fullName" className="mb-1 block text-sm font-semibold">Full name</label><input id="fullName" name="fullName" required autoComplete="name" className={input} />{fields.fullName && <p className="mt-1 text-xs text-red-700">{fields.fullName[0]}</p>}</div>}
      <div><label htmlFor="email" className="mb-1 block text-sm font-semibold">Email</label><input id="email" name="email" type="email" required autoComplete={reg ? "email" : "username"} className={input} />{fields.email && <p className="mt-1 text-xs text-red-700">{fields.email[0]}</p>}</div>
      {reg && <div><label htmlFor="phone" className="mb-1 block text-sm font-semibold">Phone / WhatsApp <span className="font-normal text-muted">(optional)</span></label><input id="phone" name="phone" type="tel" autoComplete="tel" className={input} />{fields.phone && <p className="mt-1 text-xs text-red-700">{fields.phone[0]}</p>}</div>}
      <div><label htmlFor="password" className="mb-1 block text-sm font-semibold">Password</label><input id="password" name="password" type="password" required minLength={reg ? 10 : 1} maxLength={72} autoComplete={reg ? "new-password" : "current-password"} className={input} />{reg && <p className="mt-1 text-xs text-muted">At least 10 characters.</p>}{fields.password && <p className="mt-1 text-xs text-red-700">{fields.password[0]}</p>}</div>
      {reg && (
        <>
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="consentPrivacy" required className="mt-1" /><span>I have read the <a className="font-semibold underline" href="/privacy" target="_blank">Privacy Policy</a>.</span></label>
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="consentTerms" required className="mt-1" /><span>I accept the <a className="font-semibold underline" href="/terms" target="_blank">Terms</a> and <a className="font-semibold underline" href="/refund-policy" target="_blank">Refund Policy</a>.</span></label>
        </>
      )}
      <Button type="submit" disabled={busy} className="w-full">{busy ? "Please wait…" : reg ? "Create account" : "Sign in"}</Button>
    </form>
  );
}

export function NewCaseForm({ countries }: { countries: { slug: string; name: string }[] }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true); setErr(null);
      const fd = new FormData(e.currentTarget);
      const r = await send("/api/portal/cases", "POST", { countrySlug: fd.get("countrySlug"), purpose: fd.get("purpose") });
      setBusy(false);
      if (r.ok) router.push(`/portal/cases/${r.caseId}`); else setErr(r.error ?? "Failed");
    }}>
      <div><label htmlFor="countrySlug" className="mb-1 block text-sm font-semibold">Destination</label><select id="countrySlug" name="countrySlug" required className={input} defaultValue="">{[<option key="" value="" disabled>Choose…</option>, ...countries.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)]}</select></div>
      <div><label htmlFor="purpose" className="mb-1 block text-sm font-semibold">Purpose</label><select id="purpose" name="purpose" required className={input} defaultValue="">{[<option key="" value="" disabled>Choose…</option>, ...CASE_PURPOSES.map((p) => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)]}</select></div>
      <Button type="submit" disabled={busy}>{busy ? "Creating…" : "Start a case"}</Button>
      {err && <div className="sm:col-span-3"><Notice tone="error">{err}</Notice></div>}
    </form>
  );
}

export function CaseActions(props: { caseId: string; payingStage: CaseStage | null; payStatus: string | null; canRequestReview: boolean; canAcceptQuote: boolean; canCancel: boolean }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  async function act(body: unknown, ok: string) {
    setBusy(true); setMsg(null);
    const r = await send(`/api/portal/cases/${props.caseId}`, "POST", body);
    setBusy(false);
    if (r.ok) { setMsg({ tone: "success", text: ok }); router.refresh(); } else setMsg({ tone: "error", text: r.error ?? "Failed" });
  }
  return (
    <div className="space-y-4">
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      {props.payingStage && (props.payStatus === "awaiting" || props.payStatus === "rejected") && (
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); act({ action: "mark_paid", stage: props.payingStage, clientReference: String(fd.get("ref") || "") || undefined }, "Thank you. We will check our bank record and confirm."); }}>
          <div><label htmlFor="ref" className="mb-1 block text-sm font-semibold">Your transfer reference <span className="font-normal text-muted">(optional — helps us find it)</span></label><input id="ref" name="ref" maxLength={80} className={input} /></div>
          <Button type="submit" disabled={busy}>I have made the transfer</Button>
          <p className="text-xs text-muted">Your case unlocks only after we verify the payment in our bank account — a screenshot or this button alone is not confirmation.</p>
        </form>
      )}
      {props.canRequestReview && <Button disabled={busy} onClick={() => act({ action: "request_review" }, "Sent. The review fee is now due.")}>Send documents for review</Button>}
      {props.canAcceptQuote && <Button disabled={busy} onClick={() => act({ action: "accept_quote" }, "Quote accepted. The submission fee is now due.")}>Accept the quote and continue</Button>}
      {props.canCancel && <button type="button" disabled={busy} className="block text-sm font-semibold text-red-700 underline underline-offset-4" onClick={() => { if (confirm("Cancel this case?")) act({ action: "cancel" }, "Case cancelled."); }}>Cancel this case</button>}
    </div>
  );
}

export function UploadForm({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form className="grid gap-3 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end" onSubmit={async (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const fd = new FormData(form);
      const f = fd.get("file");
      if (f instanceof File && f.size > 4 * 1024 * 1024) { setMsg({ tone: "error", text: "File is larger than 4 MB. Please compress or rescan it." }); return; }
      setBusy(true); setMsg(null);
      const r = await send(`/api/portal/cases/${caseId}/documents`, "POST", fd);
      setBusy(false);
      if (r.ok) { form.reset(); setMsg({ tone: "success", text: "Uploaded." }); router.refresh(); } else setMsg({ tone: "error", text: r.error ?? "Upload failed" });
    }}>
      <div><label htmlFor="docType" className="mb-1 block text-sm font-semibold">Document type</label><select id="docType" name="docType" required className={input} defaultValue="passport">{DOC_TYPES.map((t) => <option key={t} value={t}>{DOC_TYPE_LABEL[t]}</option>)}</select></div>
      <div><label htmlFor="file" className="mb-1 block text-sm font-semibold">File (PDF, JPG or PNG, max 4 MB)</label><input id="file" name="file" type="file" required accept="application/pdf,image/jpeg,image/png" className={input} /></div>
      <Button type="submit" disabled={busy}>{busy ? "Uploading…" : "Upload"}</Button>
      {msg && <div className="sm:col-span-3"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
    </form>
  );
}

export function DeleteDocButton({ id }: { id: string }) {
  const router = useRouter();
  return <button type="button" className="text-xs font-semibold text-red-700 underline underline-offset-4" onClick={async () => { if (!confirm("Remove this document?")) return; await send(`/api/portal/documents/${id}`, "DELETE"); router.refresh(); }}>Remove</button>;
}
