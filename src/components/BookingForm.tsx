"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { Button, Notice, cx } from "./ui";

interface ServiceOpt { slug: string; title: string; fee_pkr: number; fee_is_starting_price: boolean; duration_minutes: number | null }
interface CountryOpt { slug: string; name: string }
type Errors = Record<string, string[]>;

const inputCls = "block w-full rounded-xl border border-navy-200 bg-white px-4 py-3 text-base text-ink shadow-sm placeholder:text-slate-400 focus:border-navy-700 focus:outline-none focus:ring-2 focus:ring-gold-500/60 disabled:bg-slate-50 aria-[invalid=true]:border-red-500";

function Field({ id, label, hint, errors, children }: { id: string; label: string; hint?: string; errors?: string[]; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-navy-900">{label}</label>
      {children}
      {hint && !errors?.length && <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">{hint}</p>}
      {errors?.map((e) => <p key={e} id={`${id}-err`} className="mt-1.5 text-sm font-medium text-red-700">{e}</p>)}
    </div>
  );
}

export function BookingForm({ services, countries, defaultService, defaultCountry }: { services: ServiceOpt[]; countries: CountryOpt[]; defaultService?: string; defaultCountry?: string }) {
  const router = useRouter();
  const uid = useId();
  const [serviceSlug, setServiceSlug] = useState(services.find((s) => s.slug === defaultService)?.slug ?? services[0]?.slug ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const selected = services.find((s) => s.slug === serviceSlug);
  // YYYY-MM-DD for tomorrow in Pakistan time (UTC+5)
  const minDate = useMemo(() => new Date(Date.now() + 5 * 3600_000 + 86_400_000).toISOString().slice(0, 10), []);
  const id = (n: string) => `${uid}-${n}`;
  const a11y = (n: string) => ({ id: id(n), name: n, "aria-invalid": errors[n] ? true : undefined, "aria-describedby": errors[n] ? `${id(n)}-err` : undefined });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setErrors({});
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      fullName: fd.get("fullName"),
      email: fd.get("email"),
      phone: fd.get("phone"),
      countrySlug: fd.get("countrySlug"),
      serviceSlug: fd.get("serviceSlug"),
      preferredDate: fd.get("preferredDate"),
      preferredTime: fd.get("preferredTime"),
      message: fd.get("message") ?? "",
      consentPrivacy: fd.get("consentPrivacy") === "on",
      consentTerms: fd.get("consentTerms") === "on",
      website: fd.get("website") ?? "",
    };
    try {
      const res = await fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok) {
        try { sessionStorage.setItem("360-booking", JSON.stringify(data.booking)); } catch { /* storage unavailable: confirmation page still works */ }
        router.push(`/booking/confirmation?ref=${encodeURIComponent(data.booking.reference)}`);
        return;
      }
      if (data?.fields) setErrors(data.fields);
      setFormError(data?.error ?? "Something went wrong. Please try again.");
      document.getElementById(`${uid}-form-error`)?.focus();
    } catch {
      setFormError("We could not reach the server. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6" aria-busy={submitting}>
      {formError && (
        <div id={`${uid}-form-error`} tabIndex={-1}><Notice tone="error">{formError}</Notice></div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={id("fullName")} label="Full name" errors={errors.fullName}>
          <input {...a11y("fullName")} type="text" autoComplete="name" required minLength={2} maxLength={100} className={inputCls} disabled={submitting} />
        </Field>
        <Field id={id("email")} label="Email" errors={errors.email}>
          <input {...a11y("email")} type="email" autoComplete="email" required maxLength={254} className={inputCls} disabled={submitting} />
        </Field>
        <Field id={id("phone")} label="Phone / WhatsApp" hint="Include the country code, e.g. +92 …" errors={errors.phone}>
          <input {...a11y("phone")} type="tel" autoComplete="tel" required className={inputCls} disabled={submitting} />
        </Field>
        <Field id={id("countrySlug")} label="Country of interest" errors={errors.countrySlug}>
          <select {...a11y("countrySlug")} required defaultValue={countries.find((c) => c.slug === defaultCountry)?.slug ?? ""} className={inputCls} disabled={submitting}>
            <option value="" disabled>Select a destination</option>
            {countries.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </Field>
      </div>

      <Field id={id("serviceSlug")} label="Service" errors={errors.serviceSlug}>
        <select {...a11y("serviceSlug")} required value={serviceSlug} onChange={(e) => setServiceSlug(e.target.value)} className={inputCls} disabled={submitting}>
          {services.map((s) => <option key={s.slug} value={s.slug}>{s.title}{s.duration_minutes ? ` (${s.duration_minutes} min)` : ""}</option>)}
        </select>
        {selected && (
          <p className="mt-2 rounded-lg bg-mist px-3 py-2 text-sm text-navy-900">
            Consultancy fee: <strong>{selected.fee_is_starting_price ? "from " : ""}PKR {selected.fee_pkr.toLocaleString("en-PK")}</strong>
            <span className="text-muted"> — the final amount is calculated by our server and shown after you submit. Government/embassy fees are separate.</span>
          </p>
        )}
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={id("preferredDate")} label="Preferred date" errors={errors.preferredDate}>
          <input {...a11y("preferredDate")} type="date" required min={minDate} className={inputCls} disabled={submitting} />
        </Field>
        <Field id={id("preferredTime")} label="Preferred time (Pakistan time)" errors={errors.preferredTime}>
          <input {...a11y("preferredTime")} type="time" required className={inputCls} disabled={submitting} />
        </Field>
      </div>

      <Field id={id("message")} label="Short message (optional)" hint="Please do not include passport numbers or other ID details." errors={errors.message}>
        <textarea {...a11y("message")} rows={4} maxLength={1000} className={inputCls} disabled={submitting} />
      </Field>

      {/* Honeypot: hidden from people and assistive tech; bots fill it in. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Website<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <fieldset className="space-y-3 rounded-xl border border-line p-4">
        <legend className="px-1 text-sm font-semibold text-navy-900">Consent</legend>
        <label className="flex items-start gap-3 text-sm text-muted">
          <input type="checkbox" name="consentPrivacy" required disabled={submitting} aria-invalid={errors.consentPrivacy ? true : undefined} className="mt-0.5 size-5 shrink-0 accent-navy-800" />
          <span>I have read and accept the <a href="/privacy" target="_blank" className="font-semibold text-navy-700 underline">Privacy Policy</a>.</span>
        </label>
        {errors.consentPrivacy?.map((e) => <p key={e} className="text-sm font-medium text-red-700">{e}</p>)}
        <label className="flex items-start gap-3 text-sm text-muted">
          <input type="checkbox" name="consentTerms" required disabled={submitting} aria-invalid={errors.consentTerms ? true : undefined} className="mt-0.5 size-5 shrink-0 accent-navy-800" />
          <span>I acknowledge the <a href="/terms" target="_blank" className="font-semibold text-navy-700 underline">Terms of Service</a> and the <a href="/refund-policy" target="_blank" className="font-semibold text-navy-700 underline">Refund &amp; Cancellation Policy</a>, and understand this is a request, not a confirmed appointment.</span>
        </label>
        {errors.consentTerms?.map((e) => <p key={e} className="text-sm font-medium text-red-700">{e}</p>)}
      </fieldset>

      <Button type="submit" disabled={submitting} className={cx("w-full py-3.5 text-base sm:w-auto sm:px-8")}>
        {submitting ? <><Loader2 className="size-4 animate-spin" /> Sending…</> : "Submit booking request"}
      </Button>
    </form>
  );
}
