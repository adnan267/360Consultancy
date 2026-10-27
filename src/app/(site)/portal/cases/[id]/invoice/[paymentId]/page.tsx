import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { pkt } from "@/components/admin";
import { getClientCase } from "@/lib/cases";
import { getClientSession } from "@/lib/client-auth";
import { siteUrl } from "@/lib/env";
import { formatPkr } from "@/lib/pricing";
import { site } from "@/lib/site";
import { CASE_STAGE_LABEL } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Invoice", robots: { index: false, follow: false } };

/** Printable invoice. Exists only for a payment an admin verified against the bank record, and only for its owner. */
export default async function InvoicePage({ params }: { params: Promise<{ id: string; paymentId: string }> }) {
  const s = await getClientSession();
  if (!s) redirect("/portal/login");
  const { id, paymentId } = await params;
  if (!z.uuid().safeParse(id).success || !z.uuid().safeParse(paymentId).success) notFound();
  const d = await getClientCase(s.sub, id);
  const p = d?.payments.find((x) => x.id === paymentId);
  if (!d || !p || p.status !== "verified" || !p.invoice_no || p.received_amount_pkr == null || !p.verified_at) notFound();
  return (
    <div className="mx-auto my-10 max-w-2xl rounded-2xl border border-line bg-white p-8 shadow-card print:my-0 print:border-0 print:shadow-none">
      <div className="flex items-start justify-between gap-4">
        <div><h1 className="text-2xl font-extrabold text-navy-900">Invoice / receipt</h1><p className="mt-1 text-sm text-muted">{site.name} · {siteUrl()}</p></div>
        <p className="font-mono text-sm font-bold text-navy-900">{p.invoice_no}</p>
      </div>
      <dl className="mt-8 grid grid-cols-[10rem_1fr] gap-y-3 text-sm">
        <dt className="text-muted">Billed to</dt><dd>{d.client.full_name}</dd>
        <dt className="text-muted">Case reference</dt><dd className="font-mono">{d.case.reference}</dd>
        <dt className="text-muted">Service</dt><dd>{CASE_STAGE_LABEL[p.stage]} (private consultancy service)</dd>
        <dt className="text-muted">Amount received</dt><dd className="font-bold">{formatPkr(p.received_amount_pkr)}</dd>
        <dt className="text-muted">Payment reference</dt><dd className="font-mono">{p.bank_reference}</dd>
        <dt className="text-muted">Verified on</dt><dd>{pkt(p.verified_at)} PKT</dd>
      </dl>
      <p className="mt-8 text-xs leading-relaxed text-muted">This is a receipt for private consultancy services from {site.name}. It is not a government fee receipt. Government, embassy and biometric fees are paid directly to the relevant authority.</p>
      <p className="mt-6 text-xs text-muted print:hidden">Use your browser&rsquo;s Print option (Ctrl/Cmd + P) to save this as a PDF.</p>
    </div>
  );
}
