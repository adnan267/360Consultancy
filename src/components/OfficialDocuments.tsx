import { ExternalLink } from "lucide-react";
import type { CountryContent } from "@/data/countries";

const fmt = (d: string) => new Date(d).toLocaleDateString("en-GB", { dateStyle: "long" });

/** Document lists taken from official pages (paraphrased), each with its source link and the date we read it. */
export function OfficialDocuments({ content, name }: { content: CountryContent; name: string }) {
  if (!content.documents?.length) return null;
  return (
    <section>
      <h2 className="text-2xl font-extrabold text-navy-900">Documents listed by the official source</h2>
      <p className="mt-2 text-sm text-muted">
        Summarised from the official pages below{content.documentsChecked ? `, read on ${fmt(content.documentsChecked)}` : ""}. Your embassy, visa centre or case officer can ask for more, and lists change — always confirm on the official page before you apply.
      </p>
      <div className="mt-4 space-y-5">
        {content.documents.map((d) => (
          <div key={d.purpose + d.sourceUrl} className="rounded-xl border border-line bg-white p-4 shadow-card">
            <h3 className="font-bold text-navy-900">{name}: {d.purpose}</h3>
            <ul className="mt-3 space-y-2 text-sm text-ink">
              {d.items.map((i) => <li key={i} className="flex gap-3"><span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-gold-500" />{i}</li>)}
            </ul>
            <a href={d.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-navy-700 underline underline-offset-4">Source: {d.sourceLabel}<ExternalLink className="size-3" aria-hidden /></a>
          </div>
        ))}
      </div>
    </section>
  );
}
