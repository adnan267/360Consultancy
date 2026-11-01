"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RELIGIOUS_SECTIONS, type TourPackage } from "@/lib/types";
import { Button } from "./ui";

const input = "block w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm focus:border-navy-700 focus:outline-none focus:ring-2 focus:ring-gold-500/60";
const lines = (v: FormDataEntryValue | null) => String(v ?? "").split("\n").map((x) => x.trim()).filter(Boolean);
const SECTION_LABEL: Record<string, string> = { umrah: "Umrah Packages", hajj: "Hajj Packages", "makkah-madinah-ziyarat": "Makkah & Madinah Ziyarat", "iraq-ziyarat": "Iraq Ziyarat", "iran-ziyarat": "Iran Ziyarat", "jerusalem-al-aqsa": "Jerusalem & Al-Aqsa (information page only)", "other-religious": "Other Religious Tours" };

const slugify = (t: string) => t.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);

export function PackageForm({ pkg }: { pkg?: TourPackage }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [category, setCategory] = useState<"tour" | "religious">(pkg?.category ?? "tour");
  const editing = !!pkg;

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title") ?? "");
    const slug = editing ? pkg!.slug : String(fd.get("slug") || slugify(title));
    const priceRaw = String(fd.get("price") ?? "").trim();
    const daysRaw = String(fd.get("days") ?? "").trim();
    const payload = {
      category,
      section: category === "religious" ? String(fd.get("section") ?? "") || null : null,
      title,
      flag: String(fd.get("flag") ?? "").trim().toLowerCase() || null,
      country_slug: String(fd.get("country_slug") ?? "").trim() || null,
      summary: String(fd.get("summary") ?? ""),
      highlights: lines(fd.get("highlights")),
      inclusions: lines(fd.get("inclusions")),
      duration_days: daysRaw ? Number(daysRaw) : null,
      price_pkr: priceRaw ? Number(priceRaw) : null,
      price_note: String(fd.get("price_note") ?? "per person"),
      show_price: fd.get("show_price") === "on",
      is_published: fd.get("is_published") === "on",
      sort_order: Number(fd.get("sort_order") || 100),
    };
    setBusy(true); setMsg(null); setErr(null);
    try {
      const r = await fetch(`/api/admin/packages/${slug}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await r.json().catch(() => null);
      if (r.ok && d?.ok) { setMsg("Saved"); if (!editing) router.push("/admin/packages"); else router.refresh(); }
      else setErr(d?.error ?? "Could not save");
    } catch { setErr("Could not reach the server"); } finally { setBusy(false); }
  }
  async function remove() {
    if (!pkg || !confirm("Delete this package? This cannot be undone.")) return;
    const r = await fetch(`/api/admin/packages/${pkg.slug}`, { method: "DELETE" });
    if (r.ok) router.push("/admin/packages"); else setErr("Could not delete");
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="mb-1 block text-xs font-semibold">Type</label><select value={category} onChange={(e) => setCategory(e.target.value as "tour" | "religious")} className={input} disabled={editing}><option value="tour">Tour package</option><option value="religious">Religious tour package</option></select></div>
        {category === "religious" && <div><label className="mb-1 block text-xs font-semibold">Religious category</label><select name="section" defaultValue={pkg?.section ?? "umrah"} className={input}>{RELIGIOUS_SECTIONS.map((s) => <option key={s} value={s}>{SECTION_LABEL[s]}</option>)}</select></div>}
        <div className={category === "religious" ? "sm:col-span-2" : ""}><label className="mb-1 block text-xs font-semibold">Package name</label><input name="title" required minLength={3} maxLength={120} defaultValue={pkg?.title} className={input} placeholder="e.g. Umrah Economy 14 days" /></div>
        {!editing && <div><label className="mb-1 block text-xs font-semibold">URL name (optional)</label><input name="slug" pattern="[a-z0-9-]{3,80}" className={input} placeholder="auto from the name" /></div>}
        <div className="sm:col-span-2"><label className="mb-1 block text-xs font-semibold">Short line (best for…)</label><input name="summary" maxLength={300} defaultValue={pkg?.summary} className={input} /></div>
        <div><label className="mb-1 block text-xs font-semibold">Duration (days)</label><input name="days" type="number" min={1} max={90} defaultValue={pkg?.duration_days ?? ""} className={input} /></div>
        <div><label className="mb-1 block text-xs font-semibold">Order on the page (small = first)</label><input name="sort_order" type="number" min={0} max={10000} defaultValue={pkg?.sort_order ?? 100} className={input} /></div>
        <div><label className="mb-1 block text-xs font-semibold">Flag code (2 letters, e.g. ae, sa, tr)</label><input name="flag" maxLength={2} pattern="[a-zA-Z]{2}" defaultValue={pkg?.flag ?? ""} className={input} /></div>
        <div><label className="mb-1 block text-xs font-semibold">Country guide URL name (optional, e.g. turkey)</label><input name="country_slug" maxLength={60} defaultValue={pkg?.country_slug ?? ""} className={input} /></div>
        <div><label className="mb-1 block text-xs font-semibold">Highlights (one per line)</label><textarea name="highlights" rows={4} defaultValue={pkg?.highlights.join("\n")} className={input} /></div>
        <div><label className="mb-1 block text-xs font-semibold">What is included (one per line)</label><textarea name="inclusions" rows={4} defaultValue={pkg?.inclusions.join("\n")} className={input} /></div>
      </div>
      <fieldset className="rounded-xl border border-navy-100 bg-mist/50 p-4">
        <legend className="px-1 text-sm font-bold text-navy-900">Price</legend>
        <div className="grid items-end gap-4 sm:grid-cols-[10rem_10rem_1fr]">
          <div><label className="mb-1 block text-xs font-semibold">Price (PKR)</label><input name="price" type="number" min={0} step={1} defaultValue={pkg?.price_pkr ?? ""} className={input} /></div>
          <div><label className="mb-1 block text-xs font-semibold">Label</label><input name="price_note" maxLength={40} defaultValue={pkg?.price_note ?? "per person"} className={input} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="show_price" defaultChecked={pkg?.show_price} className="size-4 accent-navy-800" />Show the price on the website (otherwise &ldquo;Price on request&rdquo;)</label>
        </div>
        <p className="mt-2 text-xs text-muted">You can keep a price saved here and hide it from visitors. Tick &ldquo;Show&rdquo; only when the price is approved.</p>
      </fieldset>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="is_published" defaultChecked={pkg?.is_published ?? true} className="size-4 accent-navy-800" />Published (visible on the website)</label>
      {err && <p role="alert" className="text-sm font-semibold text-red-700">{err}</p>}
      <div className="flex flex-wrap items-center gap-3"><Button type="submit" disabled={busy} variant="dark">{busy ? "Saving…" : editing ? "Save changes" : "Add package"}</Button>{msg && <span className="text-sm font-semibold text-emerald-700">{msg}</span>}{editing && <button type="button" onClick={remove} className="text-sm font-semibold text-red-700 underline">Delete</button>}</div>
    </form>
  );
}

export function NewServiceForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const title = String(fd.get("title") ?? "");
    setBusy(true); setErr(null); setMsg(null);
    try {
      const r = await fetch("/api/admin/services", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        slug: String(fd.get("slug") || slugify(title)), title, summary: String(fd.get("summary") ?? ""), description: String(fd.get("description") ?? ""),
        inclusions: lines(fd.get("inclusions")), fee_pkr: Number(fd.get("fee") || 0), fee_is_starting_price: fd.get("starting") === "on", is_active: fd.get("active") === "on",
      }) });
      const d = await r.json().catch(() => null);
      if (r.ok && d?.ok) { setMsg("Service added"); form.reset(); router.refresh(); } else setErr(d?.error ?? "Could not add the service");
    } catch { setErr("Could not reach the server"); } finally { setBusy(false); }
  }
  return (
    <details className="rounded-2xl border border-navy-100 bg-white p-5">
      <summary className="cursor-pointer font-bold text-navy-900">+ Add a new service</summary>
      <form onSubmit={save} className="mt-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="mb-1 block text-xs font-semibold">Service name</label><input name="title" required minLength={3} maxLength={120} className={input} placeholder="e.g. LinkedIn Profile Makeover" /></div>
          <div><label className="mb-1 block text-xs font-semibold">URL name (optional)</label><input name="slug" pattern="[a-z0-9-]{3,80}" className={input} placeholder="auto from the name" /></div>
          <div className="sm:col-span-2"><label className="mb-1 block text-xs font-semibold">Short description (shown on cards)</label><input name="summary" required minLength={5} maxLength={300} className={input} /></div>
          <div className="sm:col-span-2"><label className="mb-1 block text-xs font-semibold">Full description</label><textarea name="description" rows={3} maxLength={2000} className={input} /></div>
          <div><label className="mb-1 block text-xs font-semibold">What is included (one per line)</label><textarea name="inclusions" rows={3} className={input} /></div>
          <div><label className="mb-1 block text-xs font-semibold">Fee (PKR)</label><input name="fee" type="number" min={0} step={1} required defaultValue={0} className={input} /><label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" name="starting" className="size-4 accent-navy-800" />Show as &ldquo;From&rdquo; price</label><label className="mt-1 flex items-center gap-2 text-sm"><input type="checkbox" name="active" className="size-4 accent-navy-800" />Active now (a fee above 0 is needed for bookings)</label></div>
        </div>
        {err && <p role="alert" className="text-sm font-semibold text-red-700">{err}</p>}
        <div className="flex items-center gap-3"><Button type="submit" disabled={busy} variant="dark">{busy ? "Adding…" : "Add service"}</Button>{msg && <span className="text-sm font-semibold text-emerald-700">{msg}</span>}</div>
      </form>
    </details>
  );
}
