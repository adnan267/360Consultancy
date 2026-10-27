"use client";

import { ExternalLink, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { CHECKLISTS } from "@/data/countries";
import { DESTINATION_REQUIREMENT_KEY, DOCUMENT_REQUIREMENTS, REQUIREMENT_NOTICE, type RequirementItem, type RequirementList } from "@/data/document-requirements";
import { DOC_TYPE_LABEL } from "@/lib/types";
import { Flag } from "./Flag";
import { Button, Card, Notice } from "./ui";

type Purpose = "study" | "work" | "visit";
interface C { slug: string; name: string; flag: string; link: { label: string; url: string } | null }

const sel = "rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-navy-700 focus:outline-none focus:ring-2 focus:ring-gold-500/60";

/** Which document list to show: a destination's list if we have one, otherwise the purpose's list. */
function pickRequirements(purpose: Purpose, slug: string): { key: string; list: RequirementList } | null {
  const destKey = slug ? DESTINATION_REQUIREMENT_KEY[slug] : undefined;
  const key = destKey ?? (!slug && purpose === "visit" ? "visit-tourist" : !slug && purpose === "work" ? "work-visa" : undefined);
  return key && DOCUMENT_REQUIREMENTS[key] ? { key, list: DOCUMENT_REQUIREMENTS[key] } : null;
}

export function ChecklistTool({ countries, initialPurpose }: { countries: C[]; initialPurpose?: Purpose }) {
  const [purpose, setPurpose] = useState<Purpose>(initialPurpose ?? "study");
  const [country, setCountry] = useState<string>("");
  const [done, setDone] = useState<Record<string, boolean>>({});

  const req = pickRequirements(purpose, country);
  const storeKey = req ? `360-req-${req.key}` : `360-checklist-${purpose}`;

  useEffect(() => {
    try { const raw = localStorage.getItem(storeKey); setDone(raw ? JSON.parse(raw) : {}); } catch { setDone({}); }
  }, [storeKey]);
  const toggle = (item: string) => setDone((d) => {
    const n = { ...d, [item]: !d[item] };
    try { localStorage.setItem(storeKey, JSON.stringify(n)); } catch { /* ignore */ }
    return n;
  });

  const c = countries.find((x) => x.slug === country);
  const heading = req ? req.list.title : CHECKLISTS[purpose].title;

  const renderItems = (items: RequirementItem[]) => (
    <ul className="space-y-3">
      {items.map((it) => (
        <li key={it.label}>
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input type="checkbox" checked={!!done[it.label]} onChange={() => toggle(it.label)} className="mt-0.5 size-5 shrink-0 accent-navy-800" />
            <span className={done[it.label] ? "text-muted line-through" : "text-navy-900"}>
              {it.label}
              {it.docType && <span className="mt-0.5 block text-xs text-muted">Upload in your portal as: {DOC_TYPE_LABEL[it.docType]}</span>}
            </span>
          </label>
        </li>
      ))}
    </ul>
  );

  const allItems = req ? [...req.list.applicant, ...(req.list.sponsor ?? [])].map((i) => i.label) : CHECKLISTS[purpose].items;
  const count = allItems.filter((i) => done[i]).length;

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
          <h2 className="flex items-center gap-3 text-xl font-extrabold text-navy-900">{c && <Flag code={c.flag} label={c.name} className="text-2xl" />}{heading}{c ? ` — ${c.name}` : ""}</h2>
          <Button variant="secondary" className="min-h-10 py-2 print:hidden" onClick={() => window.print()}><Printer className="size-4" /> Print</Button>
        </div>
        <p className="mt-1 text-sm text-muted" aria-live="polite">{count} of {allItems.length} ticked (saved in this browser only)</p>

        {req ? (
          <div className="mt-5 space-y-6">
            <div>
              <h3 className="mb-3 text-base font-bold text-navy-900">From you (applicant)</h3>
              {renderItems(req.list.applicant)}
            </div>
            {req.list.sponsor && (
              <div>
                <h3 className="mb-3 text-base font-bold text-navy-900">From your sponsor / host / employer</h3>
                {renderItems(req.list.sponsor)}
              </div>
            )}
          </div>
        ) : (
          <ul className="mt-5 space-y-3">
            {CHECKLISTS[purpose].items.map((item) => (
              <li key={item}><label className="flex cursor-pointer items-start gap-3 text-sm"><input type="checkbox" checked={!!done[item]} onChange={() => toggle(item)} className="mt-0.5 size-5 shrink-0 accent-navy-800" /><span className={done[item] ? "text-muted line-through" : "text-navy-900"}>{item}</span></label></li>
            ))}
          </ul>
        )}

        {c?.link && (
          <p className="mt-6 text-sm">Official requirements for {c.name}: <a href={c.link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-navy-700 underline underline-offset-4">{c.link.label} <ExternalLink className="size-3.5" /></a></p>
        )}
      </Card>
      <Notice tone="warn" title="Indicative only">{req ? REQUIREMENT_NOTICE : "This is a general list, not the official requirement. The authority's own checklist for your exact visa category always takes precedence, and it may ask for more or different documents."}</Notice>
    </div>
  );
}
