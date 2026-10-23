"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PAYING_STAGE } from "@/lib/case-status";
import { CASE_STAGE_LABEL, type CaseStage, type CaseStatus, type DocStatus, type PaymentStatus, type Role } from "@/lib/types";
import { Button, Notice } from "./ui";

const input = "block w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm focus:border-navy-700 focus:outline-none focus:ring-2 focus:ring-gold-500/60";

export function CaseAdminActions(props: {
  caseId: string;
  status: CaseStatus;
  role: Role;
  payments: { stage: CaseStage; status: PaymentStatus; amountPkr: number }[];
  documents: { id: string; name: string; status: DocStatus }[];
  quotePkr: number | null;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const isAdmin = props.role === "admin";
  const stage = PAYING_STAGE[props.status];
  const pay = stage ? props.payments.find((p) => p.stage === stage) : undefined;
  const final = props.status === "submitted" || props.status === "cancelled";

  async function act(body: unknown, ok: string) {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch(`/api/admin/cases/${props.caseId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { setMsg({ tone: "success", text: ok }); router.refresh(); } else setMsg({ tone: "error", text: data?.error ?? `Failed (${res.status})` });
    } catch { setMsg({ tone: "error", text: "Network error" }); }
    setBusy(false);
  }
  const f = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); return new FormData(e.currentTarget); };

  return (
    <div className="space-y-8">
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}

      {stage && pay && (pay.status === "awaiting" || pay.status === "under_review") && (
        <section>
          <h3 className="font-bold text-navy-900">Verify {CASE_STAGE_LABEL[stage].toLowerCase()} — PKR {pay.amountPkr.toLocaleString("en-PK")}</h3>
          <p className="mt-1 text-xs text-muted">Check the bank statement, then enter the transaction reference and the amount that actually arrived. A client note or screenshot is not evidence.</p>
          {isAdmin ? (
            <>
              <form className="mt-3 grid gap-3 sm:grid-cols-[1.4fr_1fr_auto] sm:items-end" onSubmit={(e) => { const fd = f(e); act({ action: "verify_payment", stage, bankReference: String(fd.get("ref")), receivedAmountPkr: Number(fd.get("amt")) }, "Payment verified. The case has moved to the next step."); }}>
                <div><label className="mb-1 block text-xs font-semibold" htmlFor="ref">Bank transaction reference</label><input id="ref" name="ref" required minLength={3} maxLength={80} className={input} /></div>
                <div><label className="mb-1 block text-xs font-semibold" htmlFor="amt">Amount received (PKR)</label><input id="amt" name="amt" type="number" min={0} required className={input} /></div>
                <Button type="submit" disabled={busy}>Verify payment</Button>
              </form>
              {pay.status === "under_review" && (
                <form className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end" onSubmit={(e) => { const fd = f(e); act({ action: "reject_payment", stage, note: String(fd.get("note")) }, "Payment rejected; the client can retry."); }}>
                  <div><label className="mb-1 block text-xs font-semibold" htmlFor="rn">Reason for rejecting (not found / wrong amount…)</label><input id="rn" name="note" required minLength={3} maxLength={500} className={input} /></div>
                  <Button type="submit" variant="secondary" disabled={busy}>Reject</Button>
                </form>
              )}
            </>
          ) : <p className="mt-2 text-sm text-muted">Only an admin can verify payments.</p>}
        </section>
      )}

      {props.status === "in_review" && (
        <section className="space-y-4">
          <h3 className="font-bold text-navy-900">Review documents</h3>
          <ul className="divide-y divide-line text-sm">{props.documents.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <span><a className="font-semibold text-navy-700 underline underline-offset-4" href={`/api/admin/documents/${d.id}`}>{d.name}</a> <span className="text-xs text-muted">({d.status})</span></span>
              <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => { const fd = f(e); const note = String(fd.get("note") || ""); const status = (e.nativeEvent as SubmitEvent).submitter?.getAttribute("value") as "accepted" | "needs_fix"; act({ action: "set_document_status", documentId: d.id, status, note: note || undefined }, "Document updated."); }}>
                <input name="note" placeholder="Note to client (required for needs-fix)" maxLength={500} className={`${input} w-64`} />
                <Button type="submit" value="accepted" disabled={busy}>Accept</Button>
                <Button type="submit" value="needs_fix" variant="secondary" disabled={busy}>Needs fix</Button>
              </form>
            </li>
          ))}</ul>
          <form className="space-y-3" onSubmit={(e) => { const fd = f(e); act({ action: "request_fixes", note: String(fd.get("note")) }, "Sent back to the client for fixes."); }}>
            <label className="block text-xs font-semibold" htmlFor="fx">Send back for fixes (at least one document marked “needs fix”)</label>
            <input id="fx" name="note" required minLength={3} maxLength={1000} className={input} placeholder="Summary of what the client must fix" />
            <Button type="submit" variant="secondary" disabled={busy}>Request fixes</Button>
          </form>
          <form className="space-y-3" onSubmit={(e) => { const fd = f(e); act({ action: "complete_review", report: String(fd.get("report")), quotePkr: Number(fd.get("quote")) }, "Review completed and the quote sent to the client."); }}>
            <label className="block text-xs font-semibold" htmlFor="rp">Review report (shown to the client — guidance only, no outcome promises)</label>
            <textarea id="rp" name="report" required minLength={20} maxLength={8000} rows={7} className={input} />
            <div className="max-w-xs"><label className="mb-1 block text-xs font-semibold" htmlFor="qt">Submission fee quote (PKR, our fee only)</label><input id="qt" name="quote" type="number" min={1} required className={input} /></div>
            <Button type="submit" disabled={busy}>Complete review</Button>
          </form>
        </section>
      )}

      {props.status === "submission_in_progress" && (
        <section>
          <h3 className="font-bold text-navy-900">Record the submission</h3>
          <p className="mt-1 text-xs text-muted">Only after the file has actually been submitted. Enter the authority&apos;s or portal&apos;s reference.</p>
          <form className="mt-3 space-y-3" onSubmit={(e) => { const fd = f(e); act({ action: "record_submission", reference: String(fd.get("sref")), notes: String(fd.get("snotes") || "") || undefined }, "Submission recorded."); }}>
            <input name="sref" required minLength={3} maxLength={120} placeholder="Submission reference" className={input} />
            <input name="snotes" maxLength={1000} placeholder="Notes for the client (optional)" className={input} />
            <Button type="submit" disabled={busy}>Mark as submitted</Button>
          </form>
        </section>
      )}

      {props.status === "cancelled" && isAdmin && props.payments.filter((p) => p.status === "verified").map((p) => (
        <section key={p.stage}>
          <Button variant="secondary" disabled={busy} onClick={() => { if (confirm(`Record a refund of the ${CASE_STAGE_LABEL[p.stage].toLowerCase()}? Do this only after you have returned the money.`)) act({ action: "refund_payment", stage: p.stage }, "Refund recorded."); }}>Record refund — {CASE_STAGE_LABEL[p.stage]}</Button>
        </section>
      ))}

      <section>
        <h3 className="font-bold text-navy-900">Internal note</h3>
        <form className="mt-2 flex gap-2" onSubmit={(e) => { const fd = f(e); const form = e.currentTarget; act({ action: "add_note", note: String(fd.get("n")) }, "Note added."); form.reset(); }}>
          <input name="n" required maxLength={1000} className={input} placeholder="Visible to staff only" /><Button type="submit" variant="secondary" disabled={busy}>Add</Button>
        </form>
      </section>

      {!final && (
        <section>
          <form className="flex gap-2" onSubmit={(e) => { const fd = f(e); if (confirm("Cancel this case?")) act({ action: "cancel", note: String(fd.get("cn")) }, "Case cancelled."); }}>
            <input name="cn" required minLength={3} maxLength={500} className={input} placeholder="Reason for cancelling" /><Button type="submit" variant="secondary" disabled={busy}>Cancel case</Button>
          </form>
        </section>
      )}
    </div>
  );
}
