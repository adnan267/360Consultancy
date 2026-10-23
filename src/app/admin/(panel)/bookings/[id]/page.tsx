import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { BookingStatusBadge, PaymentStatusBadge, pkt } from "@/components/admin";
import { BookingActions } from "@/components/AdminClient";
import { Card, Notice } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { formatPkr } from "@/lib/pricing";
import { getRepo, isDatabaseConfigured } from "@/lib/repo";
import { can } from "@/lib/status";

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!can(session.role, "booking:view")) notFound();
  if (!isDatabaseConfigured()) return <Notice tone="warn">Database not configured.</Notice>;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const d = await getRepo().getBookingDetail(id);
  if (!d) notFound();
  const { booking: b, payment: p } = d;
  const notes = d.events.filter((e) => e.action === "note_added");

  return (
    <div className="space-y-6">
      <Link href="/admin/bookings" className="text-sm font-semibold text-navy-700 hover:underline">← All bookings</Link>
      <div className="flex flex-wrap items-center gap-3"><h1 className="font-mono text-2xl font-extrabold text-navy-900">{b.reference}</h1><BookingStatusBadge status={b.status} /><PaymentStatusBadge status={p.status} />{(p.status === "verified" || p.status === "refunded") && <Link href={`/admin/bookings/${b.id}/receipt`} className="text-sm font-bold text-navy-700 underline underline-offset-4">View receipt</Link>}</div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-bold text-navy-900">Customer</h2>
          <dl className="mt-3 grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
            <dt className="text-muted">Name</dt><dd>{b.full_name}</dd>
            <dt className="text-muted">Email</dt><dd><a className="text-navy-700 hover:underline" href={`mailto:${b.email}`}>{b.email}</a></dd>
            <dt className="text-muted">Phone</dt><dd><a className="text-navy-700 hover:underline" href={`tel:${b.phone.replace(/\s/g, "")}`}>{b.phone}</a></dd>
            <dt className="text-muted">Message</dt><dd className="whitespace-pre-wrap">{b.message || "—"}</dd>
          </dl>
        </Card>
        <Card>
          <h2 className="font-bold text-navy-900">Booking</h2>
          <dl className="mt-3 grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
            <dt className="text-muted">Service</dt><dd>{d.service.title}</dd>
            <dt className="text-muted">Country</dt><dd>{d.country.name}</dd>
            <dt className="text-muted">Preferred time</dt><dd>{pkt(b.preferred_at)} PKT</dd>
            <dt className="text-muted">Fee</dt><dd>{formatPkr(b.fee_pkr)} (snapshot at request time)</dd>
            <dt className="text-muted">Created</dt><dd>{pkt(b.created_at)}</dd>
            <dt className="text-muted">Consent</dt><dd>Privacy {pkt(b.consent_privacy_at)} · Terms {pkt(b.consent_terms_at)}</dd>
            <dt className="text-muted">Bank ref</dt><dd>{p.bank_reference ?? "—"}</dd>
            <dt className="text-muted">Received</dt><dd>{p.received_amount_pkr !== null ? formatPkr(p.received_amount_pkr) : "—"}</dd>
            <dt className="text-muted">Verified</dt><dd>{p.verified_at ? pkt(p.verified_at) : "—"}</dd>
          </dl>
        </Card>
      </div>

      <Card><BookingActions id={b.id} status={b.status} paymentStatus={p.status} amountPkr={p.amount_pkr} bankReference={p.bank_reference} role={session.role} /></Card>

      <Card>
        <h2 className="font-bold text-navy-900">Internal notes</h2>
        {notes.length ? <ul className="mt-3 space-y-3">{notes.map((n) => <li key={n.id} className="rounded-lg bg-mist p-3 text-sm"><p className="whitespace-pre-wrap">{String(n.meta.note ?? "")}</p><p className="mt-1 text-xs text-muted">{n.actor_label} · {n.created_at ? pkt(n.created_at) : ""}</p></li>)}</ul> : <p className="mt-2 text-sm text-muted">No notes yet.</p>}
      </Card>

      {can(session.role, "audit:view") && (
        <Card className="overflow-x-auto">
          <h2 className="font-bold text-navy-900">Audit history</h2>
          <table className="mt-3 w-full min-w-[40rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted"><tr><th className="py-2">When (PKT)</th><th>Who</th><th>Action</th><th>Change</th><th>Details</th></tr></thead>
            <tbody className="divide-y divide-line">{d.events.map((e) => (
              <tr key={e.id}><td className="py-2 text-muted">{e.created_at ? pkt(e.created_at) : ""}</td><td>{e.actor_label}</td><td className="font-mono text-xs">{e.action}</td><td>{e.from_value || e.to_value ? `${e.from_value ?? "—"} → ${e.to_value ?? "—"}` : ""}</td><td className="max-w-xs break-words text-xs text-muted">{e.action === "note_added" ? "(see notes)" : JSON.stringify(e.meta)}</td></tr>
            ))}</tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
