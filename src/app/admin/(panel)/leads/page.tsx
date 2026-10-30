import Link from "next/link";
import { redirect } from "next/navigation";
import { pkt } from "@/components/admin";
import { LeadStatusSelect } from "@/components/AdminClient";
import { Card, Notice } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { getRepo, isDatabaseConfigured } from "@/lib/repo";
import { can } from "@/lib/status";
import { LABELS } from "@/lib/wizard";

const PAGE = 25;

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!can(session.role, "lead:view")) return <Notice tone="error">You do not have permission to view leads.</Notice>;
  if (!isDatabaseConfigured()) return <Notice tone="warn">Database not configured.</Notice>;
  const page = Math.max(1, Math.min(1000, Number((await searchParams).page) || 1));
  const { rows, total } = await getRepo().listLeads({ limit: PAGE, offset: (page - 1) * PAGE });
  const pages = Math.max(1, Math.ceil(total / PAGE));
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-navy-900">Leads</h1>
      <p className="text-sm text-muted">From the “Find your visa options” wizard. These are enquiries, not bookings, and not eligibility decisions.</p>
      <Card className="overflow-x-auto">
        {rows.length ? (
          <table className="w-full min-w-[60rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted"><tr><th className="py-2">Received (PKT)</th><th>Priority</th><th>Contact</th><th>Goal</th><th>Destination</th><th>Answers</th><th>Suggested</th><th>Status</th></tr></thead>
            <tbody className="divide-y divide-line align-top">{rows.map((l) => (
              <tr key={l.id}>
                <td className="py-3 text-muted">{pkt(l.created_at)}</td>
                <td>{(() => { const pr = String(l.answers.priority ?? ""); return pr ? <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${pr === "hot" ? "bg-red-100 text-red-800" : pr === "warm" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"}`}>{LABELS[pr] ?? pr}</span> : null; })()}{Array.isArray(l.answers.flags) && (l.answers.flags as string[]).map((f) => <p key={f} className="mt-1 text-xs text-red-700">{f}</p>)}</td>
                <td>{l.name}<br /><a className="text-navy-700 hover:underline" href={`mailto:${l.email}`}>{l.email}</a>{l.phone && <><br /><span className="text-xs text-muted">{l.phone}</span></>}</td>
                <td>{LABELS[l.purpose] ?? l.purpose}</td>
                <td>{LABELS[l.destination] ?? l.destination}</td>
                <td className="max-w-xs break-words text-xs text-muted">{Object.entries(l.answers).filter(([k]) => k !== "purpose" && k !== "destination" && k !== "priority" && k !== "flags").map(([k, v]) => k === "attribution" && v && typeof v === "object" ? `source: ${Object.entries(v as Record<string, string>).map(([a, b]) => `${a.replace("utm_", "")}=${b}`).join(", ")}` : k === "extra_answers" && Array.isArray(v) ? (v as { question: string; answer: string }[]).map((x) => `${x.question}: ${x.answer}`).join(" · ") : `${k}: ${String(v)}`).join(" · ")}</td>
                <td className="text-xs">{l.suggested_services.join(", ")}</td>
                <td><LeadStatusSelect id={l.id} status={l.status} /></td>
              </tr>
            ))}</tbody>
          </table>
        ) : <p className="py-6 text-center text-sm text-muted">No leads yet.</p>}
      </Card>
      <div className="flex items-center justify-between text-sm text-muted"><span>{total} lead{total === 1 ? "" : "s"}</span><div className="flex gap-3">{page > 1 && <Link className="font-semibold text-navy-700" href={`?page=${page - 1}`}>← Previous</Link>}<span>Page {page} of {pages}</span>{page < pages && <Link className="font-semibold text-navy-700" href={`?page=${page + 1}`}>Next →</Link>}</div></div>
    </div>
  );
}
