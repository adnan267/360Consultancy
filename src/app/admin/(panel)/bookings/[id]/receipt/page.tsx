import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { pkt } from "@/components/admin";
import { getSession } from "@/lib/auth";
import { siteUrl } from "@/lib/env";
import { formatPkr } from "@/lib/pricing";
import { getRepo, isDatabaseConfigured } from "@/lib/repo";
import { can } from "@/lib/status";
import { site } from "@/lib/site";

export const metadata = { title: "Payment receipt" };

/** Printable receipt. Only exists for payments an admin has verified against the bank record. */
export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!can(session.role, "booking:view") || !isDatabaseConfigured()) notFound();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const d = await getRepo().getBookingDetail(id);
  if (!d || !["verified", "refunded"].includes(d.payment.status) || d.payment.received_amount_pkr == null || !d.payment.verified_at) notFound();
  const { booking: b, payment: p, service } = d;

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-line bg-white p-8 shadow-card print:border-0 print:shadow-none">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900">Payment receipt</h1>
          <p className="mt-1 text-sm text-muted">{site.name} · {siteUrl()}</p>
        </div>
        <p className="font-mono text-sm font-bold text-navy-900">{b.reference}</p>
      </div>
      <dl className="mt-8 grid grid-cols-[10rem_1fr] gap-y-3 text-sm">
        {p.invoice_no && (<><dt className="text-muted">Invoice no.</dt><dd className="font-mono">{p.invoice_no}</dd></>)}
        <dt className="text-muted">Received from</dt><dd>{b.full_name}</dd>
        <dt className="text-muted">Service</dt><dd>{service.title}</dd>
        <dt className="text-muted">Amount received</dt><dd className="font-bold">{formatPkr(p.received_amount_pkr!)}</dd>
        <dt className="text-muted">Payment reference</dt><dd className="font-mono">{p.bank_reference}</dd>
        <dt className="text-muted">Verified on</dt><dd>{pkt(p.verified_at!)} PKT</dd>
        <dt className="text-muted">Status</dt><dd>{p.status === "refunded" ? "Refunded" : "Paid"}</dd>
      </dl>
      <p className="mt-8 border-t border-line pt-4 text-xs leading-relaxed text-muted">
        This receipt covers our consultancy fee only. Government, embassy and biometric fees are paid directly to the authority. Payment does not guarantee any visa outcome. This document is not a tax invoice.
      </p>
      <p className="mt-6 text-xs text-muted print:hidden">Use your browser&apos;s Print → Save as PDF to share this receipt.</p>
    </div>
  );
}
