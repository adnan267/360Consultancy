import { ExternalLink } from "lucide-react";
import { ButtonLink, Card, Notice } from "./ui";
import { whatsappLink } from "@/lib/site";

export const CHECK = "Not confirmed on this site yet — check the official site.";

export function fmtDate(d: string | null | undefined) {
  return d ? new Date(d).toLocaleDateString("en-GB", { dateStyle: "long" }) : null;
}

/** One labelled fact; shows an honest placeholder when nothing has been confirmed from an official source. */
export function Fact({ label, value, wide }: { label: string; value?: string | null; wide?: boolean }) {
  const has = !!value?.trim();
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <dt className="text-sm font-semibold text-navy-900">{label}</dt>
      <dd className={`mt-0.5 whitespace-pre-line text-sm ${has ? "text-muted" : "italic text-muted/70"}`}>{has ? value : CHECK}</dd>
    </div>
  );
}

export function VerifiedNote({ date }: { date: string | null | undefined }) {
  return <p className="text-xs text-muted">{date ? `Information last checked against the official source on ${fmtDate(date)}.` : "Not yet checked against the official source on this site. Confirm every detail on the official site before you apply."}</p>;
}

export function OfficialLink({ url, children }: { url: string; children: React.ReactNode }) {
  return <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-navy-700 underline underline-offset-4 hover:text-navy-900">{children}<ExternalLink className="size-4" aria-hidden /></a>;
}

export function ApplyCta({ subject }: { subject: string }) {
  const wa = whatsappLink(`Hello 360 Consultancy, I want help applying: ${subject}.`);
  return (
    <Card className="border-gold-500/40 bg-mist">
      <h2 className="text-xl font-extrabold text-navy-900">Apply through 360 Consultancy</h2>
      <p className="mt-1 text-sm text-muted">We assess your profile, shortlist options, prepare your documents and guide each step. We cannot guarantee admission, a scholarship or a visa — those decisions belong to the university, the funder and the embassy.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <ButtonLink href="/wizard?purpose=study">Apply now — free assessment</ButtonLink>
        <ButtonLink href="/book" variant="secondary">Book a consultation</ButtonLink>
        {wa && <ButtonLink href={wa} variant="secondary">WhatsApp us</ButtonLink>}
      </div>
    </Card>
  );
}

export function NoGuarantee() {
  return <Notice tone="warn" title="Please read">Scholarships and admissions are competitive and every country, university and funder sets its own rules, dates and fees. Nothing on this page is a promise of admission, funding or a visa. Always confirm details on the official site.</Notice>;
}
