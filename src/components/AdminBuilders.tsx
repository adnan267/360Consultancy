"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { EmailTemplateKey, WizardQuestion } from "@/lib/types";
import { Button, Notice } from "./ui";

const input = "block w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm focus:border-navy-700 focus:outline-none focus:ring-2 focus:ring-gold-500/60";

async function call(url: string, method: string, body?: unknown): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const data = await res.json().catch(() => ({}));
    return res.ok ? { ok: true } : { ok: false, error: data?.error ?? `Request failed (${res.status})` };
  } catch { return { ok: false, error: "Network error" }; }
}

function useRun() {
  const router = useRouter();
  const [msg, setMsg] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  async function run(fn: () => Promise<{ ok: boolean; error?: string }>, ok = "Saved") {
    setBusy(true); setMsg(null);
    const r = await fn();
    setBusy(false);
    if (r.ok) { setMsg({ tone: "success", text: ok }); router.refresh(); } else setMsg({ tone: "error", text: r.error ?? "Failed" });
  }
  return { msg, busy, run };
}

const KIND_LABEL = { text: "Short text", select: "Choose one", yesno: "Yes / No" } as const;
const opts = (v: FormDataEntryValue | null) => String(v ?? "").split("\n").map((x) => x.trim()).filter(Boolean);

export function QuestionManager({ initial }: { initial: WizardQuestion[] }) {
  const { msg, busy, run } = useRun();
  return (
    <div className="space-y-6">
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      <ul className="space-y-4">
        {initial.map((q) => (
          <li key={q.id} className="rounded-2xl border border-navy-100 bg-white p-4">
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); run(() => call(`/api/admin/questions/${q.id}`, "PATCH", { label: fd.get("label"), help: String(fd.get("help") || "") || null, ...(q.kind === "select" ? { options: opts(fd.get("options")) } : {}), purpose: String(fd.get("purpose") || "") || null, required: fd.get("required") === "on", sort_order: Number(fd.get("sort")), is_active: fd.get("active") === "on" })); }}>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">{KIND_LABEL[q.kind]}</p>
              <input name="label" defaultValue={q.label} required minLength={3} maxLength={200} aria-label="Question" className={input} />
              <input name="help" defaultValue={q.help ?? ""} maxLength={400} placeholder="Help text (optional)" aria-label="Help text" className={input} />
              {q.kind === "select" && <textarea name="options" defaultValue={q.options.join("\n")} rows={3} aria-label="Options, one per line" className={input} />}
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm">Show for <select name="purpose" defaultValue={q.purpose ?? ""} className={`${input} !w-36`}><option value="">Everyone</option><option value="study">Study</option><option value="work">Work</option><option value="visit">Visit</option><option value="unsure">Not sure</option></select></label>
                <label className="flex items-center gap-2 text-sm">Order <input name="sort" type="number" min={0} defaultValue={q.sort_order} className={`${input} !w-24`} /></label>
                <label className="flex items-center gap-2 text-sm"><input name="required" type="checkbox" defaultChecked={q.required} className="size-4 accent-navy-800" />Required</label>
                <label className="flex items-center gap-2 text-sm"><input name="active" type="checkbox" defaultChecked={q.is_active} className="size-4 accent-navy-800" />Shown</label>
                <Button type="submit" variant="dark" disabled={busy}>Save</Button>
                <button type="button" className="text-sm font-semibold text-red-700 hover:underline" onClick={() => { if (window.confirm("Delete this question?")) run(() => call(`/api/admin/questions/${q.id}`, "DELETE"), "Deleted"); }}>Delete</button>
              </div>
            </form>
          </li>
        ))}
      </ul>
      <form className="space-y-3 rounded-2xl border border-dashed border-navy-200 p-4" onSubmit={(e) => { e.preventDefault(); const form = e.currentTarget; const fd = new FormData(form); run(async () => { const r = await call("/api/admin/questions", "POST", { label: fd.get("label"), help: String(fd.get("help") || "") || null, kind: fd.get("kind"), options: opts(fd.get("options")), purpose: String(fd.get("purpose") || "") || null, required: fd.get("required") === "on", sort_order: 100 }); if (r.ok) form.reset(); return r; }, "Question added"); }}>
        <h2 className="font-bold text-navy-900">Add a question</h2>
        <input name="label" required minLength={3} maxLength={200} placeholder="Question, e.g. Have you travelled abroad before?" aria-label="New question" className={input} />
        <input name="help" maxLength={400} placeholder="Help text (optional)" aria-label="Help text" className={input} />
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">Type <select name="kind" defaultValue="text" className={`${input} !w-36`}><option value="text">Short text</option><option value="select">Choose one</option><option value="yesno">Yes / No</option></select></label>
          <label className="flex items-center gap-2 text-sm">Show for <select name="purpose" defaultValue="" className={`${input} !w-36`}><option value="">Everyone</option><option value="study">Study</option><option value="work">Work</option><option value="visit">Visit</option><option value="unsure">Not sure</option></select></label>
          <label className="flex items-center gap-2 text-sm"><input name="required" type="checkbox" className="size-4 accent-navy-800" />Required</label>
        </div>
        <textarea name="options" rows={3} placeholder="Options, one per line (only for “Choose one”)" aria-label="Options" className={input} />
        <Button type="submit" disabled={busy}>Add question</Button>
      </form>
    </div>
  );
}

export function TemplateManager({ templates }: { templates: { key: EmailTemplateKey; label: string; subject: string; body: string; vars: string[]; custom: boolean }[] }) {
  const { msg, busy, run } = useRun();
  return (
    <div className="space-y-6">
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      {templates.map((t) => (
        <form key={t.key} className="space-y-3 rounded-2xl border border-navy-100 bg-white p-4" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); run(() => call("/api/admin/email-templates", "PUT", { key: t.key, subject: fd.get("subject"), body: fd.get("body") })); }}>
          <h2 className="font-bold text-navy-900">{t.label} {t.custom ? <span className="text-xs font-normal text-muted">(customised)</span> : <span className="text-xs font-normal text-muted">(default)</span>}</h2>
          <input name="subject" defaultValue={t.subject} required minLength={3} maxLength={200} aria-label="Subject" className={input} />
          <textarea name="body" defaultValue={t.body} required minLength={3} maxLength={4000} rows={6} aria-label="Body" className={input} />
          <p className="text-xs text-muted">Placeholders: {t.vars.map((v) => `{{${v}}}`).join(", ")}</p>
          <Button type="submit" variant="dark" disabled={busy}>Save</Button>
        </form>
      ))}
    </div>
  );
}
