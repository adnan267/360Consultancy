import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChatAdminThread } from "@/components/ChatAdminThread";
import { Notice } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { getRepo, isDatabaseConfigured } from "@/lib/repo";
import { can } from "@/lib/status";

export default async function ChatThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!can(session.role, "lead:view")) return <Notice tone="error">You do not have permission to view chats.</Notice>;
  if (!isDatabaseConfigured()) return <Notice tone="warn">Database not configured.</Notice>;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const repo = getRepo();
  const t = await repo.getChatThread(id);
  if (!t) notFound();
  if (t.unread_admin) await repo.updateChatThread(id, { unread_admin: false });
  const messages = await repo.listChatMessages(id);
  const wa = t.visitor_contact ? t.visitor_contact.replace(/[^0-9]/g, "").replace(/^0/, "92") : "";
  return (
    <div className="space-y-4">
      <Link href="/admin/chats" className="text-sm font-semibold text-navy-700">← All chats</Link>
      <h1 className="text-2xl font-extrabold text-navy-900">{t.visitor_name}</h1>
      {t.visitor_contact && <p className="text-sm text-muted">Phone / WhatsApp: {t.visitor_contact}{wa && <> · <a className="font-semibold text-navy-700 underline" href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">Open WhatsApp</a></>}</p>}
      <ChatAdminThread id={t.id} closed={t.status === "closed"} initial={messages.map((m) => ({ id: m.id, sender: m.sender, body: m.body, at: m.created_at }))} />
    </div>
  );
}
