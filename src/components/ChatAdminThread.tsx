"use client";

import { useState } from "react";
import { Button } from "./ui";

type Msg = { id: string; sender: "visitor" | "team"; body: string; at: string };
const input = "block w-full rounded-xl border border-navy-200 bg-white px-4 py-3 text-base focus:border-navy-700 focus:outline-none focus:ring-2 focus:ring-gold-500/60";

export function ChatAdminThread({ id, initial, closed }: { id: string; initial: Msg[]; closed: boolean }) {
  const [msgs, setMsgs] = useState(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [isClosed, setClosed] = useState(closed);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !text.trim()) return;
    setBusy(true); setErr(null);
    try {
      const r = await fetch(`/api/admin/chats/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text }) });
      const d = await r.json().catch(() => null);
      if (r.ok && d?.ok) { setMsgs(d.messages.map((m: { id: string; sender: "visitor" | "team"; body: string; created_at: string }) => ({ id: m.id, sender: m.sender, body: m.body, at: m.created_at }))); setText(""); setClosed(false); }
      else setErr(d?.error ?? "Could not send");
    } catch { setErr("Could not reach the server"); } finally { setBusy(false); }
  }
  async function toggle() {
    const status = isClosed ? "open" : "closed";
    const r = await fetch(`/api/admin/chats/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (r.ok) setClosed(!isClosed);
  }
  return (
    <div className="space-y-4">
      <div className="max-h-[60vh] space-y-2 overflow-y-auto rounded-xl border border-line bg-mist/50 p-4">
        {msgs.map((m) => (
          <div key={m.id} className={m.sender === "team" ? "text-right" : ""}>
            <span className={`inline-block max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2 text-left text-sm ${m.sender === "team" ? "bg-navy-900 text-white" : "bg-white text-navy-900 shadow-card"}`}>{m.body}</span>
            <p className="mt-0.5 text-[11px] text-muted">{m.sender === "team" ? "You" : "Visitor"} · {new Date(m.at).toLocaleString("en-GB", { timeZone: "Asia/Karachi" })}</p>
          </div>
        ))}
      </div>
      {err && <p role="alert" className="text-sm font-medium text-red-700">{err}</p>}
      <form onSubmit={send} className="flex gap-3">
        <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} rows={2} placeholder="Type your reply…" className={input} aria-label="Reply" />
        <Button type="submit" disabled={busy}>{busy ? "Sending…" : "Send"}</Button>
      </form>
      <button type="button" onClick={toggle} className="text-sm font-semibold text-muted underline underline-offset-4">{isClosed ? "Re-open chat" : "Mark as closed"}</button>
    </div>
  );
}
