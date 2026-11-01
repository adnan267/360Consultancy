import Link from "next/link";
import { redirect } from "next/navigation";
import { pkt } from "@/components/admin";
import { Card, Notice } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { getRepo, isDatabaseConfigured } from "@/lib/repo";
import { can } from "@/lib/status";

export default async function ChatsPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!can(session.role, "lead:view")) return <Notice tone="error">You do not have permission to view chats.</Notice>;
  if (!isDatabaseConfigured()) return <Notice tone="warn">Database not configured.</Notice>;
  const threads = await getRepo().listChatThreads(100);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-navy-900">Website chats</h1>
      <p className="text-sm text-muted">Visitors who used the chat box on the website. Reply here, or contact them on the WhatsApp number they left.</p>
      <Card>
        {threads.length ? (
          <ul className="divide-y divide-line">{threads.map((t) => (
            <li key={t.id}>
              <Link href={`/admin/chats/${t.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3 hover:bg-mist/60">
                <span><strong className="text-navy-900">{t.visitor_name}</strong>{t.visitor_contact && <span className="ml-2 text-sm text-muted">{t.visitor_contact}</span>}{t.landing && <span className="ml-2 text-xs text-muted">via {t.landing}</span>}</span>
                <span className="flex items-center gap-3 text-xs text-muted">{t.unread_admin && <span className="rounded-full bg-red-100 px-2 py-0.5 font-bold text-red-800">New</span>}{t.status === "closed" && <span>Closed</span>}{pkt(t.last_message_at)}</span>
              </Link>
            </li>
          ))}</ul>
        ) : <p className="py-6 text-center text-sm text-muted">No chats yet.</p>}
      </Card>
    </div>
  );
}
