import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { pkt, PaymentStatusBadge } from "@/components/admin";
import { CaseActions, PayOnlineButton, DeleteDocButton, MessageBox, PortalLogout, UploadForm } from "@/components/PortalClient";
import { Badge, Card, Container, Notice } from "@/components/ui";
import { getClientCase, MAX_DOCS_PER_CASE } from "@/lib/cases";
import { PAYING_STAGE, UPLOADS_OPEN } from "@/lib/case-status";
import { getRepo } from "@/lib/repo";
import { getClientSession } from "@/lib/client-auth";
import { bankDetails, nowPaymentsConfig } from "@/lib/env";
import { formatPkr } from "@/lib/pricing";
import { CASE_STAGE_LABEL, DECISION_LABEL, CASE_STATUS_LABEL, DOC_TYPE_LABEL, type CaseStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const STEPS: { label: string; done: CaseStatus[] }[] = [
  { label: "Pay starting fee", done: ["documents_open", "awaiting_review_payment", "in_review", "review_complete", "awaiting_submission_payment", "submission_in_progress", "submitted", "completed"] },
  { label: "Upload documents", done: ["awaiting_review_payment", "in_review", "review_complete", "awaiting_submission_payment", "submission_in_progress", "submitted", "completed"] },
  { label: "Pay review fee", done: ["in_review", "review_complete", "awaiting_submission_payment", "submission_in_progress", "submitted", "completed"] },
  { label: "Document review", done: ["review_complete", "awaiting_submission_payment", "submission_in_progress", "submitted", "completed"] },
  { label: "Accept quote & pay submission fee", done: ["submission_in_progress", "submitted", "completed"] },
  { label: "File submitted", done: ["submitted", "completed"] },
  { label: "Files handed over", done: ["completed"] },
];

// Only these events are shown to clients, and never their internal details (staff notes, bank references).
const CLIENT_EVENTS: Record<string, string> = { case_created: "Case opened", case_status_changed: "Status updated", payment_status_changed: "Payment status updated", document_uploaded: "Document uploaded", document_reviewed: "Document reviewed", quote_accepted: "Quote accepted" };

export default async function PortalCase({ params }: { params: Promise<{ id: string }> }) {
  const s = await getClientSession();
  if (!s) redirect("/portal/login");
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const d = await getClientCase(s.sub, id);
  if (!d) notFound();
  const { case: c } = d;
  const messages = await getRepo().listCaseMessages(c.id, { includeInternal: false });
  const invoices = d.payments.filter((p) => p.status === "verified" && p.invoice_no);
  const stage = PAYING_STAGE[c.status] ?? null;
  const pay = stage ? d.payments.find((p) => p.stage === stage) : undefined;
  const bank = bankDetails();
  const uploadsOpen = UPLOADS_OPEN.includes(c.status);

  return (
    <Container className="space-y-8 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/portal" className="text-sm font-semibold text-navy-700 hover:underline">← Your cases</Link>
        <PortalLogout />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-2xl font-extrabold text-navy-900">{c.reference}</h1>
        <Badge tone={c.status === "submitted" || c.status === "completed" ? "green" : c.status === "cancelled" ? "gray" : "navy"}>{CASE_STATUS_LABEL[c.status]}</Badge>
        <span className="text-sm text-muted">{d.country.name} · {c.purpose}</span>
      </div>

      <ol className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {STEPS.map((st, i) => {
          const done = st.done.includes(c.status);
          return <li key={st.label} className={`rounded-xl border p-3 text-xs font-semibold ${done ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-line bg-white text-muted"}`}><span className="mb-1 block text-[10px] uppercase tracking-wider">{done ? "Done" : `Step ${i + 1}`}</span>{st.label}</li>;
        })}
      </ol>

      {stage && pay && (
        <Card className="border-gold-500">
          <h2 className="font-bold text-navy-900">{CASE_STAGE_LABEL[stage]} — {formatPkr(pay.amount_pkr)} <PaymentStatusBadge status={pay.status} /></h2>
          {stage === "submission" && <p className="mt-1 text-sm text-muted">This is the quote you accepted for submitting your file.</p>}
          {nowPaymentsConfig() && pay.status !== "verified" ? (
            <div className="mt-4 space-y-3">
              <PayOnlineButton caseId={c.id} stage={stage} summary={{
                service: `${c.purpose[0].toUpperCase() + c.purpose.slice(1)} visa consultancy — ${d.country.name}`,
                stageLabel: CASE_STAGE_LABEL[stage],
                amount: formatPkr(pay.amount_pkr),
                included: stage === "intake" ? "Opening your case and a first assessment of your situation, plus access to secure document upload." : stage === "review" ? "A consultant's review of your documents, written feedback on gaps and corrections, and a quote for the remaining work." : "Preparing and handing over the agreed application file, as set out in the quote you accepted.",
              }} />
              {pay.status === "under_review" && <Notice tone="info">We are checking a payment on this stage. If you already paid, this page updates automatically once it is confirmed.</Notice>}
            </div>
          ) : pay.status === "under_review" ? (
            <div className="mt-3"><Notice tone="info">We have your payment note and will confirm it against our bank record. This page updates once it is verified.</Notice></div>
          ) : (
            <div className="mt-4 grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-bold">How to pay (bank transfer)</h3>
                {bank.configured ? (
                  <dl className="mt-2 grid grid-cols-[7rem_1fr] gap-y-1 text-sm">
                    <dt className="text-muted">Account title</dt><dd>{bank.accountTitle}</dd>
                    <dt className="text-muted">Bank</dt><dd>{bank.bankName}</dd>
                    {bank.accountNumber && <><dt className="text-muted">Account no.</dt><dd className="font-mono">{bank.accountNumber}</dd></>}
                    {bank.iban && <><dt className="text-muted">IBAN</dt><dd className="font-mono">{bank.iban}</dd></>}
                    <dt className="text-muted">Amount</dt><dd className="font-bold">{formatPkr(pay.amount_pkr)}</dd>
                    <dt className="text-muted">Reference</dt><dd className="font-mono font-bold">{c.reference}</dd>
                  </dl>
                ) : <p className="mt-2 text-sm text-muted">Our bank details will appear here once payments open. Please do not pay before then.</p>}
                <p className="mt-3 text-xs text-muted">Transfer the exact amount and quote the reference above. Government fees are not included and are paid directly to the authority.</p>
              </div>
              <CaseActions caseId={c.id} payingStage={stage} payStatus={pay.status} canRequestReview={false} canAcceptQuote={false} canCancel={false} />
            </div>
          )}
          {pay.status === "rejected" && <div className="mt-3"><Notice tone="warn">We could not match this payment to our bank record. Please check the amount and reference, then try again or contact us.</Notice></div>}
        </Card>
      )}

      {(uploadsOpen || d.documents.length > 0) && (
        <Card>
          <h2 className="font-bold text-navy-900">Your documents</h2>
          {uploadsOpen && <p className="mt-1 text-sm text-muted">Upload clear scans or photos. Only PDF, JPG and PNG up to 4 MB each (up to {MAX_DOCS_PER_CASE} files). Do not upload anything you are not comfortable sharing with our team.</p>}
          {d.documents.length > 0 && (
            <ul className="mt-4 divide-y divide-line text-sm">{d.documents.map((x) => (
              <li key={x.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div><p className="font-semibold">{DOC_TYPE_LABEL[x.doc_type]}</p><p className="text-xs text-muted">{x.original_name} · {(x.size_bytes / 1024).toFixed(0)} KB · {pkt(x.uploaded_at)}</p>{x.admin_note && <p className="mt-1 text-xs font-semibold text-amber-800">Note from our team: {x.admin_note}</p>}</div>
                <div className="flex items-center gap-3"><Badge tone={x.status === "accepted" ? "green" : x.status === "needs_fix" ? "amber" : "gray"}>{x.status === "needs_fix" ? "Needs fix" : x.status === "accepted" ? "Accepted" : "Uploaded"}</Badge><a className="text-xs font-semibold text-navy-700 underline underline-offset-4" href={`/api/portal/documents/${x.id}`}>Download</a>{uploadsOpen && x.status !== "accepted" && <DeleteDocButton id={x.id} />}</div>
              </li>
            ))}</ul>
          )}
          {uploadsOpen && <div className="mt-5 space-y-5"><UploadForm caseId={c.id} /><CaseActions caseId={c.id} payingStage={null} payStatus={null} canRequestReview={d.documents.length > 0} canAcceptQuote={false} canCancel={false} />{d.payments.some((p) => p.stage === "review" && p.status !== "verified") || !d.payments.some((p) => p.stage === "review") ? <p className="text-xs text-muted">Sending your documents for review makes the review fee due.</p> : <p className="text-xs text-muted">Your review fee is already paid, so re-sending after fixes costs nothing extra.</p>}</div>}
        </Card>
      )}

      {c.status === "in_review" && <Notice tone="info" title="Under review">Our team is reviewing your documents. You will see a report here when it is ready.</Notice>}

      {c.review_report && (
        <Card>
          <h2 className="font-bold text-navy-900">Document review report</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{c.review_report}</p>
          <p className="mt-3 text-xs text-muted">This report is guidance on your documents. It is not a prediction or guarantee of any visa decision.</p>
          {c.status === "review_complete" && c.submission_quote_pkr && (
            <div className="mt-5 rounded-xl bg-mist p-4">
              <p className="font-bold text-navy-900">Optional: we can submit your file — {formatPkr(c.submission_quote_pkr)}</p>
              <p className="mt-1 text-sm text-muted">Our fee only; government fees are paid directly to the authority. You pay nothing more unless you accept.</p>
              <div className="mt-3"><CaseActions caseId={c.id} payingStage={null} payStatus={null} canRequestReview={false} canAcceptQuote canCancel={false} /></div>
            </div>
          )}
        </Card>
      )}

      {c.status === "submission_in_progress" && <Notice tone="info" title="Payment confirmed">We are preparing your submission. You will see the submission details here once it is done.</Notice>}
      {c.status === "submitted" && (
        <Notice tone="success" title="Your file has been submitted">
          Submission reference: <span className="font-mono font-bold">{c.submission_reference}</span>{c.submitted_at && <> · {pkt(c.submitted_at)} PKT</>}.{c.submission_notes && <> {c.submission_notes}</>} Decisions are made only by the relevant authority.
        </Notice>
      )}

      {d.deliverables.length > 0 && (
        <Card className="border-gold-500">
          <h2 className="font-bold text-navy-900">Your files</h2>
          <ul className="mt-3 divide-y divide-line text-sm">{d.deliverables.map((x) => (
            <li key={x.id} className="flex flex-wrap items-center justify-between gap-3 py-2"><a className="font-semibold text-navy-700 underline underline-offset-4" href={`/api/portal/deliverables/${x.id}`}>{x.original_name}</a><span className="text-xs text-muted">{(x.size_bytes / 1024).toFixed(0)} KB · {pkt(x.uploaded_at)} PKT</span></li>
          ))}</ul>
        </Card>
      )}

      {c.status === "completed" && (
        <Notice tone="success" title="Our work on this case is complete">
          Handed over{c.handover_at && <> on {pkt(c.handover_at)} PKT</>}.{c.handover_notes && <span className="mt-1 block whitespace-pre-wrap">{c.handover_notes}</span>}
        </Notice>
      )}

      {(c.status === "submitted" || c.status === "completed") && c.submitted_at && (
        <Card>
          <h2 className="font-bold text-navy-900">Official visa decision</h2>
          {c.decision ? (
            <p className="mt-2 text-sm"><span className="font-bold">{DECISION_LABEL[c.decision]}</span>{c.decision_at && <> · recorded {pkt(c.decision_at)} PKT</>}</p>
          ) : (
            <p className="mt-2 text-sm text-muted">No official decision has been recorded yet. The decision is made only by the relevant authority, separately from our work. Message us when you hear the outcome.</p>
          )}
        </Card>
      )}

      {["awaiting_intake_payment", "awaiting_review_payment", "awaiting_submission_payment"].includes(c.status) && !d.payments.some((p) => p.status === "verified" || p.status === "under_review") && (
        <CaseActions caseId={c.id} payingStage={null} payStatus={null} canRequestReview={false} canAcceptQuote={false} canCancel />
      )}

      {invoices.length > 0 && (
        <Card>
          <h2 className="font-bold text-navy-900">Invoices &amp; receipts</h2>
          <ul className="mt-3 divide-y divide-line text-sm">{invoices.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-2"><span><span className="font-mono font-semibold">{p.invoice_no}</span> <span className="text-muted">· {CASE_STAGE_LABEL[p.stage]} · {formatPkr(p.amount_pkr)}</span></span><a className="font-semibold text-navy-700 underline underline-offset-4" href={`/portal/cases/${c.id}/invoice/${p.id}`} target="_blank" rel="noopener">View / print</a></li>
          ))}</ul>
        </Card>
      )}

      <Card>
        <h2 className="font-bold text-navy-900">Messages</h2>
        {messages.length === 0 ? <p className="mt-2 text-sm text-muted">No messages yet. Write to our team below — we reply here and by email.</p> : (
          <ul className="mt-3 space-y-3">{messages.map((m) => (
            <li key={m.id} className={`max-w-[85%] rounded-xl p-3 text-sm ${m.sender === "client" ? "ml-auto bg-navy-900 text-white" : "bg-mist text-navy-900"}`}>
              <p className="whitespace-pre-wrap">{m.body}</p>
              <p className={`mt-1 text-[11px] ${m.sender === "client" ? "text-navy-200" : "text-muted"}`}>{m.sender === "client" ? "You" : m.sender_label} · {pkt(m.created_at)}</p>
            </li>
          ))}</ul>
        )}
        <MessageBox caseId={c.id} />
      </Card>

      <Card>
        <h2 className="font-bold text-navy-900">Activity</h2>
        <ul className="mt-3 space-y-2 text-sm">{[...d.events].filter((e) => CLIENT_EVENTS[e.action]).sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? "")).map((e, i) => <li key={i} className="flex justify-between gap-3"><span>{CLIENT_EVENTS[e.action]}</span><span className="text-muted">{pkt(e.created_at!)}</span></li>)}</ul>
      </Card>
    </Container>
  );
}
