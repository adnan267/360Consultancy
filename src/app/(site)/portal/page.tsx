import Link from "next/link";
import { redirect } from "next/navigation";
import { NewCaseForm, PortalLogout } from "@/components/PortalClient";
import { Badge, Card, Container } from "@/components/ui";
import { getClientSession } from "@/lib/client-auth";
import { formatPkr } from "@/lib/pricing";
import { getRepo } from "@/lib/repo";
import { CASE_STATUS_LABEL } from "@/lib/types";
import { INTAKE_SERVICE_SLUG, REVIEW_SERVICE_SLUG } from "@/lib/cases";

export const dynamic = "force-dynamic";

export default async function PortalHome() {
  const s = await getClientSession();
  if (!s) redirect("/portal/login");
  const repo = getRepo();
  const [client, cases, countries, intake, review] = await Promise.all([repo.getClientById(s.sub), repo.listCasesForClient(s.sub), repo.listCountries({ activeOnly: true }), repo.getServiceBySlug(INTAKE_SERVICE_SLUG), repo.getServiceBySlug(REVIEW_SERVICE_SLUG)]);
  if (!client) redirect("/portal/login");
  return (
    <Container className="space-y-8 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-sm text-muted">Welcome</p><h1 className="text-2xl font-extrabold text-navy-900">{client.full_name}</h1></div>
        <PortalLogout />
      </div>

      <Card>
        <h2 className="font-bold text-navy-900">Start a new case</h2>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted">
          <li>Pay the starting fee{intake ? ` (${formatPkr(intake.fee_pkr)})` : ""} — this opens secure document upload.</li>
          <li>Upload your documents.</li>
          <li>Pay the document review fee{review ? ` (${formatPkr(review.fee_pkr)})` : ""} — our team reviews your documents and sends a report.</li>
          <li>If you want us to submit your file, we quote the submission fee; you pay it only after you accept.</li>
        </ol>
        <p className="mt-3 text-xs text-muted">Our fees are separate from government, embassy and biometric fees, which you pay directly to the authority. Fees shown may change before launch. No visa outcome is ever guaranteed.</p>
        <div className="mt-5"><NewCaseForm countries={countries.filter((c) => c.slug !== "other").map((c) => ({ slug: c.slug, name: c.name }))} /></div>
      </Card>

      <section>
        <h2 className="mb-3 font-bold text-navy-900">Your cases</h2>
        {cases.length ? (
          <ul className="space-y-3">{cases.map((c) => (
            <li key={c.id}><Link href={`/portal/cases/${c.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white p-4 shadow-card transition hover:border-gold-500">
              <span><span className="font-mono font-bold text-navy-900">{c.reference}</span> <span className="text-sm text-muted">· {c.country_name} · {c.purpose}</span></span>
              <Badge tone={c.status === "submitted" ? "green" : c.status === "cancelled" ? "gray" : "navy"}>{CASE_STATUS_LABEL[c.status]}</Badge>
            </Link></li>
          ))}</ul>
        ) : <p className="text-sm text-muted">No cases yet.</p>}
      </section>
    </Container>
  );
}
