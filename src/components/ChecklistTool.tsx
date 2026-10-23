"use client";

import { ExternalLink, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { CHECKLISTS } from "@/data/countries";
import { Flag } from "./Flag";
import { Button, Card, Notice } from "./ui";

type Purpose = "study" | "work" | "visit";
interface C { slug: string; name: string; flag: string; link: { label: string; url: string } | null }

const sel = "rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-navy-700 focus:outline-none focus:ring-2 focus:ring-gold-500/60";

export function ChecklistTool({ countries, initialPurpose }: { countries: C[]; initialPurpose?: Purpose }) {
  const [purpose, setPurpose] = useState<Purpose>(initialPurpose ?? "study");
  const [country, setCountry] = useState<string>("");
  const [done, setDone] = useState<Record<string, boolean>>({});
  const key = `360-checklist-${purpose}`;

  useEffect(() => {
    try { const raw = localStorage.getItem(key); setDone(raw ? JSON.parse(raw) : {}); } catch { setDone({}); }
  }, [key]);
  const toggle = (item: string) => setDone((d) => {
    const n = { ...d, [item]: !d[item] };
    try { localStorage.setItem(key, JSON.stringify(n)); } catch { /* ignore */ }
    return n;
  });

  const list = CHECKLISTS[purpose];
  const c = countries.find((x) => x.slug === country);
  const count = list.items.filter((i) => done[i]).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card className="print:hidden">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label htmlFor="purpose" className="mb-1 block text-sm font-semibold">Purpose</label><select id="purpose" className={`${sel} w-full`} value={purpose} onChange={(e) => setPurpose(e.target.value as Purpose)}><option value="study">Study</option><option value="work">Work</option><option value="visit">Visit / tourism</option></select></div>
          <div><label htmlFor="country" className="mb-1 block text-sm font-semibold">Destination (optional)</label><select id="country" className={`${sel} w-full`} value={country} onChange={(e) => setCountry(e.target.value)}><option value="">Not chosen</option>{countries.map((x) => <option key={x.slug} value={x.slug}>{x.name}</option>)}</select></div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-3 text-xl font-extrabold text-navy-900">{c && <Flag code={c.flag} label={c.name} className="text-2xl" />}{list.title}{c ? ` — ${c.name}` : ""}</h2>
          <Button variant="secondary" className="min-h-10 py-2 print:hidden" onClick={() => window.print()}><Printer className="size-4" /> Print</Button>
        </div>
        <p className="mt-1 text-sm text-muted" aria-live="polite">{count} of {list.items.length} ticked (saved in this browser only)</p>
        <ul className="mt-5 space-y-3">
          {list.items.map((item) => (
            <li key={item}><label className="flex cursor-pointer items-start gap-3 text-sm"><input type="checkbox" checked={!!done[item]} onChange={() => toggle(item)} className="mt-0.5 size-5 shrink-0 accent-navy-800" /><span className={done[item] ? "text-muted line-through" : "text-navy-900"}>{item}</span></label></li>
          ))}
        </ul>
        {c?.link && (
          <p className="mt-6 text-sm">Official requirements for {c.name}: <a href={c.link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-navy-700 underline underline-offset-4">{c.link.label} <ExternalLink className="size-3.5" /></a></p>
        )}
      </Card>
      <Notice tone="warn" title="Indicative only">This is a general list, not the official requirement. The authority&apos;s own checklist for your exact visa category always takes precedence, and it may ask for more or different documents.</Notice>
    </div>
  );
}
