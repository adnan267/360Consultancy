"use client";

import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  activeSteps, LABELS, STEP_LABEL, suggest, validateStep,
  type StepId, type WizardDraft,
} from "@/lib/wizard";
import { Flag } from "./Flag";
import { Button, Card, Notice, cx } from "./ui";

interface Props {
  leadsEnabled: boolean;
  countries: { slug: string; name: string; flag: string }[];
  services: { slug: string; title: string; summary: string }[];
}

const KEY = "360-wizard-v1";
const input = "block w-full rounded-xl border border-navy-200 bg-white px-4 py-3 text-base shadow-sm focus:border-navy-700 focus:outline-none focus:ring-2 focus:ring-gold-500/60 aria-[invalid=true]:border-red-500";

function Choice({ name, value, current, onChange, children, flag }: { name: string; value: string; current: string | undefined; onChange: (v: string) => void; children: React.ReactNode; flag?: React.ReactNode }) {
  const checked = current === value;
  return (
    <label className={cx("flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border-2 bg-white px-4 py-3 text-sm font-semibold transition focus-within:ring-2 focus-within:ring-gold-500", checked ? "border-navy-800 bg-mist text-navy-900" : "border-line text-muted hover:border-navy-200")}>
      <input type="radio" name={name} value={value} checked={checked} onChange={() => onChange(value)} className="size-4 accent-navy-800" />
      {flag}
      <span>{children}</span>
    </label>
  );
}

function Group({ legend, error, children, cols = 2 }: { legend: string; error?: string; children: React.ReactNode; cols?: 1 | 2 | 3 }) {
  return (
    <fieldset aria-invalid={error ? true : undefined}>
      <legend className="mb-3 text-base font-bold text-navy-900">{legend}</legend>
      <div className={cx("grid gap-3", cols === 2 && "sm:grid-cols-2", cols === 3 && "sm:grid-cols-2 lg:grid-cols-3")}>{children}</div>
      {error && <p role="alert" className="mt-2 text-sm font-medium text-red-700">{error}</p>}
    </fieldset>
  );
}

export function Wizard({ leadsEnabled, countries, services }: Props) {
  const uid = useId();
  const [a, setA] = useState<WizardDraft>({});
  const [idx, setIdx] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resumeOffer, setResumeOffer] = useState<WizardDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [contactErr, setContactErr] = useState<Record<string, string[]>>({});
  const [formErr, setFormErr] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  const steps = useMemo(() => activeSteps(a), [a]);
  const step: StepId = steps[Math.min(idx, steps.length - 1)] ?? "purpose";
  const set = <K extends keyof WizardDraft>(k: K, v: WizardDraft[K]) => { setA((p) => ({ ...p, [k]: v })); setErrors((p) => { const n = { ...p }; delete n[k as string]; return n; }); };

  // Save-and-resume: answers only (never contact details), in this browser only.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const d = JSON.parse(raw) as WizardDraft; if (d && typeof d === "object" && d.purpose) setResumeOffer(d); }
    } catch { /* storage unavailable */ }
  }, []);
  useEffect(() => {
    if (!a.purpose) return;
    try { localStorage.setItem(KEY, JSON.stringify(a)); } catch { /* ignore */ }
  }, [a]);
  useEffect(() => { heading.current?.focus(); }, [step]);

  function next() {
    const e = validateStep(step, a);
    setErrors(e);
    if (Object.keys(e).length) return;
    setIdx((i) => Math.min(i + 1, steps.length - 1));
  }
  const back = () => { setErrors({}); setIdx((i) => Math.max(0, i - 1)); };
  const startOver = () => { try { localStorage.removeItem(KEY); } catch { /* ignore */ } setA({}); setIdx(0); setErrors({}); setSaved(false); setResumeOffer(null); };

  const sug = useMemo(() => suggest(a), [a]);
  const suggestedServices = services.filter((s) => sug.serviceSlugs.includes(s.slug));
  const progress = Math.round((idx / (steps.length - 1)) * 100);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    setSaving(true); setContactErr({}); setFormErr(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/leads", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: a, contact: { name: fd.get("name"), email: fd.get("email"), phone: fd.get("phone") ?? "", consentPrivacy: fd.get("consentPrivacy") === "on", website: fd.get("website") ?? "" } }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok) { setSaved(true); try { localStorage.removeItem(KEY); } catch { /* ignore */ } }
      else { if (data?.fields) setContactErr(data.fields); setFormErr(data?.error ?? "Something went wrong. Please try again."); }
    } catch { setFormErr("We could not reach the server. Please try again."); }
    finally { setSaving(false); }
  }

  const err = (k: string) => errors[k];

  return (
    <div className="mx-auto max-w-3xl">
      {resumeOffer && !a.purpose && (
        <div className="mb-6"><Notice tone="info" title="Pick up where you left off?">
          <div className="mt-2 flex flex-wrap gap-2">
            <Button variant="dark" className="min-h-10 py-2" onClick={() => { setA(resumeOffer); setIdx(0); setResumeOffer(null); }}>Resume</Button>
            <Button variant="secondary" className="min-h-10 py-2" onClick={startOver}>Start over</Button>
          </div>
        </Notice></div>
      )}

      <div className="mb-6" aria-label="Progress">
        <div className="mb-2 flex items-center justify-between text-sm font-semibold text-navy-800">
          <span>Step {idx + 1} of {steps.length}: {STEP_LABEL[step]}</span><span>{progress}%</span>
        </div>
        <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="Wizard progress" className="h-2 overflow-hidden rounded-full bg-navy-100">
          <div className="h-full rounded-full bg-gold-500 transition-all duration-300" style={{ width: `${Math.max(progress, 6)}%` }} />
        </div>
        <ol className="mt-3 hidden gap-2 sm:flex">
          {steps.map((s, i) => <li key={s} aria-current={i === idx ? "step" : undefined} className={cx("flex-1 rounded-lg px-2 py-1 text-center text-xs font-semibold", i === idx ? "bg-navy-900 text-white" : i < idx ? "bg-navy-100 text-navy-800" : "bg-mist text-muted")}>{STEP_LABEL[s]}</li>)}
        </ol>
      </div>

      <Card key={step} className="animate-step p-6 sm:p-8">
        <h2 ref={heading} tabIndex={-1} className="mb-6 text-2xl font-extrabold text-navy-900 outline-none">
          {step === "purpose" && "What are you planning?"}
          {step === "destination" && "Where would you like to go?"}
          {step === "profile" && (a.purpose === "study" ? "About your studies" : a.purpose === "work" ? "About your work background" : "About your visit")}
          {step === "budget" && "Budget and funding"}
          {step === "support" && "How can we help?"}
          {step === "review" && "Review your answers"}
        </h2>

        <div className="space-y-8">
          {step === "purpose" && (
            <Group legend="Choose one" error={err("purpose")}>
              {(["study", "work", "visit", "unsure"] as const).map((p) => <Choice key={p} name={`${uid}-purpose`} value={p} current={a.purpose} onChange={(v) => { setA({ purpose: v as never }); setErrors({}); }}>{p === "visit" ? "Visit / tourism (incl. e-visa)" : LABELS[p]}</Choice>)}
            </Group>
          )}

          {step === "destination" && (
            <Group legend="Choose a destination" error={err("destination")} cols={3}>
              {countries.map((c) => <Choice key={c.slug} name={`${uid}-dest`} value={c.slug} current={a.destination} onChange={(v) => set("destination", v as never)} flag={<Flag code={c.flag} label={c.name} className="text-xl" />}>{c.name}</Choice>)}
              <Choice name={`${uid}-dest`} value="undecided" current={a.destination} onChange={(v) => set("destination", v as never)}>Not decided yet</Choice>
            </Group>
          )}

          {step === "profile" && a.purpose === "study" && (<>
            <Group legend="Your current education level" error={err("educationLevel")}>
              {(["high_school", "bachelor", "master", "other"] as const).map((v) => <Choice key={v} name={`${uid}-edu`} value={v} current={a.educationLevel} onChange={(x) => set("educationLevel", x as never)}>{LABELS[v]}</Choice>)}
            </Group>
            <Group legend="Level you want to study" error={err("targetLevel")}>
              {(["diploma", "bachelor", "master", "doctoral"] as const).map((v) => <Choice key={v} name={`${uid}-tl`} value={v} current={a.targetLevel} onChange={(x) => set("targetLevel", x as never)}>{LABELS[v]}</Choice>)}
            </Group>
            <div><label htmlFor={`${uid}-fos`} className="mb-1.5 block text-base font-bold text-navy-900">Field of study <span className="font-normal text-muted">(optional)</span></label><input id={`${uid}-fos`} maxLength={80} value={a.fieldOfStudy ?? ""} onChange={(e) => set("fieldOfStudy", e.target.value)} className={input} /></div>
            <Group legend="English test" error={err("englishTest")} cols={3}>
              {(["have", "planning", "none"] as const).map((v) => <Choice key={v} name={`${uid}-en`} value={v} current={a.englishTest} onChange={(x) => set("englishTest", x as never)}>{LABELS[v]}</Choice>)}
            </Group>
          </>)}

          {step === "profile" && a.purpose === "work" && (<>
            <div><label htmlFor={`${uid}-occ`} className="mb-1.5 block text-base font-bold text-navy-900">Occupation or field</label><input id={`${uid}-occ`} maxLength={80} value={a.occupation ?? ""} onChange={(e) => set("occupation", e.target.value)} aria-invalid={err("occupation") ? true : undefined} className={input} />{err("occupation") && <p role="alert" className="mt-2 text-sm font-medium text-red-700">{err("occupation")}</p>}</div>
            <Group legend="Years of experience" error={err("yearsExperience")}>
              {(["0-1", "2-4", "5-9", "10+"] as const).map((v) => <Choice key={v} name={`${uid}-yrs`} value={v} current={a.yearsExperience} onChange={(x) => set("yearsExperience", x as never)}>{v} years</Choice>)}
            </Group>
            <Group legend="Do you have a job offer?" error={err("jobOffer")} cols={3}>
              {(["yes", "looking", "no"] as const).map((v) => <Choice key={v} name={`${uid}-jo`} value={v} current={a.jobOffer} onChange={(x) => set("jobOffer", x as never)}>{v === "looking" ? "Looking for one" : LABELS[v]}</Choice>)}
            </Group>
          </>)}

          {step === "profile" && a.purpose === "visit" && (<>
            <Group legend="Purpose of visit" error={err("visitPurpose")}>
              {(["tourism", "family", "business", "other"] as const).map((v) => <Choice key={v} name={`${uid}-vp`} value={v} current={a.visitPurpose} onChange={(x) => set("visitPurpose", x as never)}>{LABELS[v]}</Choice>)}
            </Group>
            <Group legend="When do you plan to travel?" error={err("travelWindow")}>
              {(["within_3_months", "3_to_6_months", "6_plus_months", "unsure"] as const).map((v) => <Choice key={v} name={`${uid}-tw`} value={v} current={a.travelWindow} onChange={(x) => set("travelWindow", x as never)}>{v === "unsure" ? "Not sure" : LABELS[v]}</Choice>)}
            </Group>
          </>)}

          {step === "budget" && (<>
            <Group legend="Overall budget for the plan (approximate)" error={err("budgetBand")}>
              {(["under_500k", "500k_1500k", "1500k_3000k", "3000k_plus", "unsure"] as const).map((v) => <Choice key={v} name={`${uid}-bb`} value={v} current={a.budgetBand} onChange={(x) => set("budgetBand", x as never)}>{v === "unsure" ? "Not sure yet" : LABELS[v]}</Choice>)}
            </Group>
            <Group legend="How will costs be funded?" error={err("fundingSource")} cols={3}>
              {(["self", "family", "scholarship", "employer", "mixed"] as const).map((v) => <Choice key={v} name={`${uid}-fs`} value={v} current={a.fundingSource} onChange={(x) => set("fundingSource", x as never)}>{v === "family" ? "Family" : LABELS[v]}</Choice>)}
            </Group>
          </>)}

          {step === "support" && (<>
            <Group legend="Your timeline" error={err("timeline")}>
              {(["asap", "within_3_months", "3_to_6_months", "flexible"] as const).map((v) => <Choice key={v} name={`${uid}-tm`} value={v} current={a.timeline} onChange={(x) => set("timeline", x as never)}>{LABELS[v]}</Choice>)}
            </Group>
            <fieldset><legend className="mb-3 text-base font-bold text-navy-900">Anything else? <span className="font-normal text-muted">(optional)</span></legend>
              <div className="space-y-2">
                {a.purpose === "study" && <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={!!a.wantsScholarshipHelp} onChange={(e) => set("wantsScholarshipHelp", e.target.checked)} className="size-5 accent-navy-800" />I would like help finding scholarships</label>}
                <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={!!a.wantsDocReview} onChange={(e) => set("wantsDocReview", e.target.checked)} className="size-5 accent-navy-800" />I would like my documents reviewed</label>
              </div>
            </fieldset>
          </>)}

          {step === "review" && (<>
            <dl className="divide-y divide-line rounded-xl border border-line text-sm">
              {(["purpose", "destination", "educationLevel", "targetLevel", "fieldOfStudy", "englishTest", "occupation", "yearsExperience", "jobOffer", "visitPurpose", "travelWindow", "budgetBand", "fundingSource", "timeline"] as const)
                .filter((k) => a[k] !== undefined && a[k] !== "")
                .map((k) => <div key={k} className="grid grid-cols-[10rem_1fr] gap-3 px-4 py-2.5"><dt className="text-muted">{k.replace(/([A-Z])/g, " $1").toLowerCase()}</dt><dd className="font-semibold text-navy-900">{LABELS[String(a[k])] ?? String(a[k])}</dd></div>)}
            </dl>
            <div>
              <h3 className="text-lg font-extrabold text-navy-900">Suggested next steps</h3>
              <ul className="mt-3 space-y-3">
                {suggestedServices.map((s) => <li key={s.slug} className="rounded-xl border border-line p-4"><p className="font-bold text-navy-900">{s.title}</p><p className="mt-1 text-sm text-muted">{s.summary}</p></li>)}
                {sug.links.map((l) => <li key={l.href}><Link href={l.href} className="font-semibold text-navy-700 underline underline-offset-4">{l.label} →</Link></li>)}
              </ul>
              <div className="mt-4 space-y-2">{sug.notes.map((n) => <p key={n} className="text-xs leading-relaxed text-muted">{n}</p>)}</div>
            </div>

            {leadsEnabled ? (saved ? (
              <Notice tone="success" title="Thank you — your details are saved">We will use them to follow up about your options. This is not a booking or an eligibility decision.</Notice>
            ) : (
              <form onSubmit={save} noValidate className="space-y-4 rounded-xl border border-line bg-mist/60 p-5" aria-busy={saving}>
                <h3 className="text-lg font-extrabold text-navy-900">Want us to follow up?</h3>
                <p className="text-sm text-muted">Optional. We only collect what is needed to contact you. No passport or ID details.</p>
                {formErr && <Notice tone="error">{formErr}</Notice>}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label htmlFor={`${uid}-n`} className="mb-1 block text-sm font-semibold">Name</label><input id={`${uid}-n`} name="name" required minLength={2} maxLength={100} autoComplete="name" className={input} disabled={saving} aria-invalid={contactErr.name ? true : undefined} />{contactErr.name?.map((m) => <p key={m} className="mt-1 text-sm font-medium text-red-700">{m}</p>)}</div>
                  <div><label htmlFor={`${uid}-e`} className="mb-1 block text-sm font-semibold">Email</label><input id={`${uid}-e`} name="email" type="email" required maxLength={254} autoComplete="email" className={input} disabled={saving} aria-invalid={contactErr.email ? true : undefined} />{contactErr.email?.map((m) => <p key={m} className="mt-1 text-sm font-medium text-red-700">{m}</p>)}</div>
                  <div className="sm:col-span-2"><label htmlFor={`${uid}-p`} className="mb-1 block text-sm font-semibold">Phone / WhatsApp <span className="font-normal text-muted">(optional)</span></label><input id={`${uid}-p`} name="phone" type="tel" autoComplete="tel" className={input} disabled={saving} aria-invalid={contactErr.phone ? true : undefined} />{contactErr.phone?.map((m) => <p key={m} className="mt-1 text-sm font-medium text-red-700">{m}</p>)}</div>
                </div>
                <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
                <label className="flex items-start gap-3 text-sm text-muted"><input type="checkbox" name="consentPrivacy" required disabled={saving} className="mt-0.5 size-5 shrink-0 accent-navy-800" /><span>I have read and accept the <a href="/privacy" target="_blank" className="font-semibold text-navy-700 underline">Privacy Policy</a>.</span></label>
                {contactErr.consentPrivacy?.map((m) => <p key={m} className="text-sm font-medium text-red-700">{m}</p>)}
                <Button type="submit" disabled={saving}>{saving ? <><Loader2 className="size-4 animate-spin" /> Saving…</> : "Save my details"}</Button>
              </form>
            )) : (
              <Notice tone="info" title="Follow-up requests are not open yet">You can still use the suggestions above. Saving your details will be available once our services open.</Notice>
            )}
            {err("form") && <Notice tone="error">{err("form")}</Notice>}
          </>)}
        </div>

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-6">
          <Button variant="secondary" onClick={back} disabled={idx === 0}><ArrowLeft className="size-4" /> Back</Button>
          <div className="flex items-center gap-3">
            {idx > 0 && <button type="button" onClick={startOver} className="text-sm font-semibold text-muted underline underline-offset-4 hover:text-navy-900">Start over</button>}
            {step !== "review" && <Button onClick={next}>Continue <ArrowRight className="size-4" /></Button>}
          </div>
        </div>
      </Card>
      <p className="mt-4 text-center text-xs text-muted">Your answers are kept in this browser only until you save them or start over. This is not an official eligibility check and does not guarantee any outcome.</p>
    </div>
  );
}
