"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "./ui";

type Kind = "destinations" | "universities" | "scholarships";
type F = { k: string; label: string; t: "text" | "area" | "lines" | "links" | "select" | "check" | "date" | "number" | "url"; opts?: string[]; hint?: string; wide?: boolean };

const REGIONS = ["Asia & Middle East", "Europe", "North America", "Oceania"];
const FUNDING = ["not_stated", "full", "tuition_free", "partial", "other"];

export const FIELDS: Record<Kind, F[]> = {
  destinations: [
    { k: "name", label: "Country name", t: "text" }, { k: "flag", label: "Flag code (2 letters)", t: "text" },
    { k: "region", label: "Region", t: "select", opts: REGIONS }, { k: "sort_order", label: "Order (small = first)", t: "number" },
    { k: "overview", label: "Overview of studying here", t: "area", wide: true },
    { k: "degree_programs", label: "Degree programs", t: "area" }, { k: "tuition_info", label: "Tuition fee information", t: "area" },
    { k: "living_cost", label: "Living cost estimate", t: "area" }, { k: "language_requirements", label: "Language requirements", t: "area" },
    { k: "english_tests", label: "IELTS / TOEFL requirements", t: "area" }, { k: "admission_requirements", label: "Admission requirements", t: "area" },
    { k: "visa_requirements", label: "Student visa requirements", t: "area" }, { k: "work_options", label: "Work opportunities", t: "area" },
    { k: "official_links", label: "Official links (one per line: Label | https://…)", t: "links", wide: true },
    { k: "last_verified", label: "Last verified from official source", t: "date" },
    { k: "is_published", label: "Published (visible on the website)", t: "check" },
  ],
  universities: [
    { k: "name", label: "University name", t: "text" }, { k: "country_slug", label: "Country URL name (e.g. china, turkey, united-kingdom)", t: "text" },
    { k: "city", label: "City", t: "text" }, { k: "logo_url", label: "Logo image URL (https)", t: "url" },
    { k: "official_url", label: "Official website (https)", t: "url" }, { k: "admission_portal_url", label: "Official admission portal (https)", t: "url" },
    { k: "overview", label: "Overview", t: "area", wide: true },
    { k: "ranking", label: "World ranking (e.g. 25)", t: "text" }, { k: "ranking_source", label: "Ranking source (e.g. QS)", t: "text" },
    { k: "ranking_year", label: "Ranking year", t: "number" }, { k: "degree_levels", label: "Degree levels (bachelor, master, doctoral — one per line)", t: "lines" },
    { k: "programs", label: "Study programs (one per line)", t: "lines" }, { k: "tuition_range", label: "Tuition fee range", t: "area" },
    { k: "admission_requirements", label: "Admission requirements", t: "area" }, { k: "english_requirements", label: "English language requirements", t: "area" },
    { k: "scholarships_note", label: "Available scholarships (by degree and intake)", t: "area" }, { k: "scholarship_coverage", label: "Scholarship coverage", t: "area" },
    { k: "tuition_free_note", label: "Tuition-free note (fill ONLY if the university states it; shows on the Tuition-Free page)", t: "area", wide: true },
    { k: "apply_opens", label: "Applications open", t: "text" }, { k: "apply_closes", label: "Applications close", t: "text" },
    { k: "last_verified", label: "Last verified from official source", t: "date" }, { k: "sort_order", label: "Order", t: "number" },
    { k: "is_published", label: "Published", t: "check" },
  ],
  scholarships: [
    { k: "name", label: "Scholarship name", t: "text" }, { k: "country_slug", label: "Country URL name", t: "text" },
    { k: "provider", label: "Sponsoring organization", t: "text" }, { k: "official_url", label: "Official page (https)", t: "url" },
    { k: "funding_type", label: "Classification", t: "select", opts: FUNDING }, { k: "degree_levels", label: "Degree levels (one per line)", t: "lines" },
    { k: "eligible_nationalities", label: "Eligible nationalities", t: "area" }, { k: "disciplines", label: "Eligible disciplines", t: "area" },
    { k: "funding_details", label: "Funding details (as the official page says)", t: "area", wide: true },
    { k: "tuition_coverage", label: "Tuition coverage", t: "area" }, { k: "stipend", label: "Monthly stipend", t: "area" },
    { k: "accommodation", label: "Accommodation", t: "area" }, { k: "airfare", label: "Airfare", t: "area" }, { k: "insurance", label: "Medical insurance", t: "area" },
    { k: "eligibility_summary", label: "Eligibility requirements", t: "area", wide: true }, { k: "min_qualification", label: "Minimum academic qualifications", t: "area" },
    { k: "age_requirement", label: "Age requirements", t: "area" }, { k: "language_requirement", label: "Language requirements", t: "area" },
    { k: "required_documents", label: "Required documents (one per line)", t: "lines" },
    { k: "opens_note", label: "Application opening (text)", t: "area" }, { k: "deadline", label: "Closing date", t: "date" },
    { k: "deadline_note", label: "Closing date note", t: "area" }, { k: "duration", label: "Duration", t: "text" },
    { k: "last_verified", label: "Last verified from official source", t: "date" }, { k: "sort_order", label: "Order", t: "number" },
    { k: "is_published", label: "Published", t: "check" },
  ],
};

const input = "block w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm focus:border-navy-700 focus:outline-none focus:ring-2 focus:ring-gold-500/60";
const slugify = (t: string) => t.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

export function StudyForm({ kind, slug, row }: { kind: Kind; slug?: string; row?: Record<string, unknown> }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const editing = !!slug;
  const fields = FIELDS[kind];
  const val = (k: string) => row?.[k];

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const p: Record<string, unknown> = {};
    for (const f of fields) {
      const raw = fd.get(f.k);
      const s = String(raw ?? "").trim();
      if (f.t === "check") p[f.k] = fd.get(f.k) === "on";
      else if (f.t === "number") p[f.k] = s ? Number(s) : f.k === "sort_order" ? 100 : null;
      else if (f.t === "lines") p[f.k] = s.split("\n").map((x) => x.trim()).filter(Boolean);
      else if (f.t === "links") p[f.k] = s.split("\n").map((x) => x.trim()).filter(Boolean).map((l) => { const [label, ...u] = l.split("|"); return { label: label.trim(), url: u.join("|").trim() }; });
      else if (f.t === "date" || f.t === "url" || f.k === "flag") p[f.k] = s ? (f.k === "flag" ? s.toLowerCase() : s) : null;
      else p[f.k] = s;
    }
    if (kind === "universities" && p.official_url === null) p.official_url = "";
    const id = editing ? slug! : String(fd.get("__slug") || slugify(String(p.name ?? "")));
    setBusy(true); setMsg(null); setErr(null);
    try {
      const r = await fetch(`/api/admin/study/${kind}/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) });
      const d = await r.json().catch(() => null);
      if (r.ok && d?.ok) { setMsg("Saved"); if (!editing) router.push("/admin/study"); else router.refresh(); }
      else setErr(d?.error ?? "Could not save");
    } catch { setErr("Could not reach the server"); } finally { setBusy(false); }
  }
  async function remove() {
    if (!slug || !confirm("Delete this record? This cannot be undone.")) return;
    const r = await fetch(`/api/admin/study/${kind}/${slug}`, { method: "DELETE" });
    if (r.ok) router.push("/admin/study"); else setErr("Could not delete");
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {!editing && <div className="sm:col-span-2"><label className="mb-1 block text-xs font-semibold">URL name (optional — made from the name if empty)</label><input name="__slug" pattern="[a-z0-9-]{2,100}" className={input} /></div>}
        {fields.map((f) => {
          const v = val(f.k);
          const cls = f.wide ? "sm:col-span-2" : "";
          if (f.t === "check") return <label key={f.k} className="flex items-center gap-2 text-sm font-semibold sm:col-span-2"><input type="checkbox" name={f.k} defaultChecked={editing ? Boolean(v) : true} className="size-4 accent-navy-800" />{f.label}</label>;
          return (
            <div key={f.k} className={cls}>
              <label className="mb-1 block text-xs font-semibold">{f.label}</label>
              {f.t === "area" ? <textarea name={f.k} rows={f.wide ? 4 : 3} defaultValue={String(v ?? "")} className={input} />
                : f.t === "lines" ? <textarea name={f.k} rows={4} defaultValue={Array.isArray(v) ? v.join("\n") : ""} className={input} />
                : f.t === "links" ? <textarea name={f.k} rows={4} defaultValue={Array.isArray(v) ? (v as { label: string; url: string }[]).map((l) => `${l.label} | ${l.url}`).join("\n") : ""} className={input} />
                : f.t === "select" ? <select name={f.k} defaultValue={String(v ?? f.opts![0])} className={input}>{f.opts!.map((o) => <option key={o} value={o}>{o}</option>)}</select>
                : <input name={f.k} type={f.t === "number" ? "number" : f.t === "date" ? "date" : "text"} defaultValue={v == null ? (f.k === "sort_order" ? 100 : "") : String(v)} className={input} />}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted">Fill only what an official source states. Leave a field blank if you have not confirmed it — the website then shows “check the official site”.</p>
      {err && <p role="alert" className="text-sm font-semibold text-red-700">{err}</p>}
      <div className="flex flex-wrap items-center gap-3"><Button type="submit" disabled={busy} variant="dark">{busy ? "Saving…" : editing ? "Save changes" : "Add"}</Button>{msg && <span className="text-sm font-semibold text-emerald-700">{msg}</span>}{editing && <button type="button" onClick={remove} className="text-sm font-semibold text-red-700 underline">Delete</button>}</div>
    </form>
  );
}
