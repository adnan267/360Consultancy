import { Clock } from "lucide-react";
import { Flag } from "./Flag";
import { ButtonLink, Card } from "./ui";
import { formatPackagePrice } from "@/lib/packages";
import { whatsappLink } from "@/lib/site";
import type { TourPackage } from "@/lib/types";

export function PackageCard({ p, entryHref }: { p: TourPackage; entryHref?: string }) {
  const price = formatPackagePrice(p);
  const wa = whatsappLink(`Hello 360 Consultancy, I would like a quote for: ${p.title}.`);
  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-center gap-3">{p.flag && <Flag code={p.flag} label={p.title} className="text-3xl" />}<h3 className="text-xl font-bold text-navy-900">{p.title}</h3></div>
      {p.summary && <p className="mt-2 text-sm font-semibold text-gold-700">{p.summary}</p>}
      {p.duration_days && <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted"><Clock className="size-4" aria-hidden />{p.duration_days} days</p>}
      {p.highlights.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">{p.highlights.map((h) => <li key={h}>{h}</li>)}</ul>}
      {p.inclusions.length > 0 && (
        <div className="mt-3"><p className="text-xs font-bold uppercase tracking-wider text-navy-800">Included</p><ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted">{p.inclusions.map((h) => <li key={h}>{h}</li>)}</ul></div>
      )}
      <div className="mt-auto pt-5">
        <p className="text-lg font-extrabold text-navy-900">{price ?? <span className="text-base font-bold text-navy-700">Price on request</span>}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {wa && <ButtonLink href={wa} className="min-h-10 px-4 py-2 text-sm">Get a quote</ButtonLink>}
          {entryHref && <ButtonLink href={entryHref} variant="secondary" className="min-h-10 px-4 py-2 text-sm">Entry rules</ButtonLink>}
        </div>
      </div>
    </Card>
  );
}
