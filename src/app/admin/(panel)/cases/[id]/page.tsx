import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { PaymentStatusBadge, pkt } from "@/components/admin";
import { CaseAdminActions } from "@/components/AdminCaseClient";
import { StaffMessageForm } from "@/components/AdminClient";
import { Badge, Card, Notice } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { formatPkr } from "@/lib/pricing";
import { getRepo, isDatabaseConfigured } from "@/lib/repo";
import { can } from "@/lib/status";
import { CASE_STAGE_LABEL, CASE_STATUS_LABEL, DOC_TYPE_LABEL } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!can(session.role, "case:view")) notFound();
  if (!isDatabaseConfigured()) return <Notice tone="warn">Database not configured.</Notice>;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const d = await getRepo().getCaseDetail(id);
  if (!d) notFound();
  const { case: c } = d;
  const messages = await getRepo().listCaseMessages(id, { includeInternal: true });
  const events = [...d.events].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));

  return (
    <div className="space-y-6">
      <Link href="/admin/cases" className="text-sm font-semibold text-navy-700 hover:underline">← All cases</Link>
      <div className="flex flex-wrap items-center gap-3"><h1 className="font-mono text-2xl font-extrabold text-navy-900">{c.reference}</h1><Badge tone={c.status === "submitted" ? "green" : c.status === "cancelled" ? "gray" : "navy"}>{CASE_STATUS_LABEL[c.status]}</Badge></div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-bold text-navy-900">Client</h2>
          <dl className="mt-3 grid grid-cols-[7rem_1fr] gap-y-2 text-sm">
            <dt className="text-muted">Name</dt><dd>{d.client.full_name}</dd>
            <dt className="text-muted">Email</dt><dd><a className="text-navy-700 hover:underline" href={`mailto:${d.client.email}`}>{d.client.email}</a></dd>
            <dt className="text-muted">Phone</dt><dd>{d.client.phone ?? "—"}</dd>
            <dt className="text-muted">Destination</dt><dd>{d.country.name}</dd>
            <dt className="text-muted">Purpose</dt><dd className="capitalize">{c.purpose}</dd>
            <dt className="text-muted">Opened</dt><dd>{pkt(c.created_at)}</dd>
            {c.submission_reference && <><dt className="text-muted">Submission ref</dt><dd className="font-mono">{c.submission_reference}</dd></>}
          </dl>
        </Card>
        <Card>
          <h2 className="font-bold text-navy-900">Payments</h2>
          <table className="mt-3 w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted"><tr><th className="pb-2">Stage</th><th>Due</th><th>Status</th><th>Client says</th><th>Bank ref</th></tr></thead>
            <tbody className="divide-y divide-line">{d.payments.map((p) => (
              <tr key={p.id}><td className="py-2">{CASE_STAGE_LABEL[p.stage]}</td><td>{formatPkr(p.amount_pkr)}</td><td><PaymentStatusBadge status={p.status} /></td><td className="text-xs">{p.client_reference ?? "—"}</td><td className="font-mono text-xs">{p.bank_reference ?? "—"}</td></tr>
            ))}</tbody>
          </table>
          <p className="mt-2 text-xs text-muted">Stage 3 is created only when the client accepts your quote.</p>
        </Card>
      </div>

      {can(session.role, "document:view") ? <Card>
        <h2 className="font-bold text-navy-900">Documents ({d.documents.length})</h2>
        {d.documents.length ? (
          <ul className="mt-3 divide-y divide-line text-sm">{d.documents.map((x) => (
            <li key={x.id} className="flex flex-wrap items-center justify-between gap-3 py-2">
              <span><a className="font-semibold text-navy-700 underline underline-offset-4" href={`/api/admin/documents/${x.id}`}>{x.original_name}</a> <span className="text-xs text-muted">· {DOC_TYPE_LABEL[x.doc_type]} · {(x.size_bytes / 1024).toFixed(0)} KB · {pkt(x.uploaded_at)}</span>{x.admin_note && <span className="block text-xs text-amber-800">Note: {x.admin_note}</span>}</span>
              <Badge tone={x.status === "accepted" ? "green" : x.status === "needs_fix" ? "amber" : "gray"}>{x.status}</Badge>
            </li>
          ))}</ul>
        ) : <p className="mt-2 text-sm text-muted">Nothing uploaded yet.</p>}
        <p className="mt-3 text-xs text-muted">Downloads are logged. Files are not virus-scanned — open them in a safe viewer.</p>
      </Card> : <Card><p className="text-sm text-muted">Your role does not include access to client documents.</p></Card>}

      {c.review_report && <Card><h2 className="font-bold text-navy-900">Review report sent to client</h2><p className="mt-2 whitespace-pre-wrap text-sm">{c.review_report}</p>{c.submission_quote_pkr && <p className="mt-2 text-sm font-semibold">Quote: {formatPkr(c.submission_quote_pkr)}</p>}</Card>}

      <Card>
        <h2 className="mb-4 font-bold text-navy-900">Actions</h2>
        <CaseAdminActions caseId={c.id} status={c.status} role={session.role} quotePkr={c.submission_quote_pkr} payments={d.payments.map((p) => ({ stage: p.stage, status: p.status, amountPkr: p.amount_pkr }))} documents={d.documents.map((x) => ({ id: x.id, name: x.original_name, status: x.status }))} />
      </Card>

      <Card>
        <h2 className="font-bold text-navy-900">Messages &amp; internal notes</h2>
        {messages.length === 0 ? <p className="mt-2 text-sm text-muted">No messages yet.</p> : (
          <ul className="mt-3 space-y-3">{messages.map((m) => (
            <li key={m.id} className={`rounded-xl p-3 text-sm ${m.internal ? "border border-amber-300 bg-amber-50" : m.sender === "client" ? "bg-mist" : "bg-navy-50"}`}>
              <p className="whitespace-pre-wrap">{m.body}</p>
              <p className="mt-1 text-[11px] text-muted">{m.internal ? "INTERNAL NOTE · staff only" : m.sender === "client" ? m.sender_label : "Sent to client"} · {pkt(m.created_at)}</p>
            </li>
          ))}</ul>
        )}
        {can(session.role, "case:message") && <StaffMessageForm caseId={c.id} />}
      </Card>

      <Card>
        <h2 className="font-bold text-navy-900">Timeline</h2>
        <ul className="mt-3 space-y-2 text-sm">{events.map((e, i) => (
          <li key={i} className="flex flex-wrap justify-between gap-2 border-b border-line pb-2 last:border-0"><span><span className="font-semibold">{e.action.replace(/_/g, " ")}</span>{(e.from_value || e.to_value) && <span className="text-muted"> · {e.from_value ?? "—"} → {e.to_value ?? "—"}</span>}<span className="text-muted"> · {e.actor_label}</span>{typeof e.meta?.note === "string" && <span className="block text-xs">“{e.meta.note}”</span>}</span><span className="text-xs text-muted">{pkt(e.created_at!)}</span></li>
        ))}</ul>
      </Card>
    </div>
  );
}
