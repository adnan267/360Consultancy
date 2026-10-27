"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { useState } from "react";
import { Card } from "./ui";

export interface NoteRow { id: string; title: string; link: string | null; read: boolean; at: string }

export function NotificationCentre({ items }: { items: NoteRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const unread = items.filter((i) => !i.read).length;
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-bold text-navy-900"><Bell className="size-4" aria-hidden /> Notifications{unread > 0 && <span className="rounded-full bg-gold-500 px-2 py-0.5 text-xs font-bold text-navy-900">{unread} new</span>}</h2>
        {unread > 0 && <button type="button" disabled={busy} className="text-sm font-semibold underline underline-offset-4" onClick={async () => { setBusy(true); try { await fetch("/api/portal/notifications", { method: "POST" }); } finally { setBusy(false); router.refresh(); } }}>Mark all read</button>}
      </div>
      {items.length === 0 ? <p className="mt-3 text-sm text-muted">Nothing yet. Updates about your cases will appear here.</p> : (
        <ul className="mt-3 divide-y divide-line text-sm">
          {items.map((n) => (
            <li key={n.id} className="flex items-center justify-between gap-3 py-2">
              <span className={n.read ? "text-muted" : "font-semibold text-navy-900"}>{n.link ? <Link href={n.link} className="hover:underline">{n.title}</Link> : n.title}</span>
              <time className="shrink-0 text-xs text-muted" dateTime={n.at}>{new Date(n.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</time>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
