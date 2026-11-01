"use client";

import { MessageSquare, Send, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type Msg = { id: string; sender: "visitor" | "team"; body: string; at: string };
const input = "block w-full rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm focus:border-navy-700 focus:outline-none focus:ring-2 focus:ring-gold-500/60";

/** Website chat. Visitors need no account; their messages go to Admin → Chats. Polls only while the panel is open. */
export function ChatWidget({ lp }: { lp?: string }) {
  const [open, setOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string[]>>({});
  const bottom = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/chat", { cache: "no-store" });
      const d = await r.json();
      if (d?.ok) { setStarted(!!d.started); setMsgs(d.messages ?? []); }
    } catch { /* offline */ }
  }, []);

  useEffect(() => {
    if (!open) return;
    refresh();
    const t = setInterval(() => { if (document.visibilityState === "visible") refresh(); }, 6000);
    return () => clearInterval(t);
  }, [open, refresh]);
  useEffect(() => { bottom.current?.scrollIntoView({ block: "end" }); }, [msgs, open]);

  async function post(payload: Record<string, unknown>) {
    setBusy(true); setErr(null); setFields({});
    try {
      const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await r.json().catch(() => null);
      if (r.ok && d?.ok) { setMsgs(d.messages); setStarted(true); setText(""); return true; }
      if (d?.fields) setFields(d.fields);
      setErr(d?.error ?? "Something went wrong. Please try again.");
    } catch { setErr("We could not reach the server."); } finally { setBusy(false); }
    return false;
  }

  function onStart(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    post({ action: "start", name: fd.get("name"), contact: fd.get("contact") ?? "", message: fd.get("message"), landing: lp, website: fd.get("website") ?? "" });
  }
  function onSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    post({ action: "send", message: text });
  }

  return (
    <>
      {!open && (
        <button type="button" onClick={() => setOpen(true)} className="fixed bottom-5 left-5 z-50 inline-flex min-h-14 items-center gap-2 rounded-full bg-navy-900 px-5 text-sm font-bold text-white shadow-lg transition hover:scale-105" aria-label="Open website chat">
          <MessageSquare className="size-5" aria-hidden /> Chat with us
        </button>
      )}
      {open && (
        <section aria-label="Website chat" className="fixed inset-x-3 bottom-3 z-50 flex max-h-[80dvh] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xl sm:inset-x-auto sm:bottom-5 sm:left-5 sm:w-[22rem]">
          <header className="flex items-center justify-between bg-navy-900 px-4 py-3 text-white">
            <div><p className="text-sm font-bold">360 Consultancy</p><p className="text-xs text-navy-200">We usually reply here or on WhatsApp</p></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat" className="rounded-lg p-1.5 hover:bg-white/10"><X className="size-5" /></button>
          </header>
          {started ? (
            <>
              <div className="min-h-40 flex-1 space-y-2 overflow-y-auto bg-mist/50 p-3" aria-live="polite">
                {msgs.map((m) => (
                  <div key={m.id} className={m.sender === "visitor" ? "text-right" : ""}>
                    <span className={`inline-block max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-left text-sm ${m.sender === "visitor" ? "bg-navy-900 text-white" : "bg-white text-navy-900 shadow-card"}`}>{m.body}</span>
                  </div>
                ))}
                <div ref={bottom} />
              </div>
              {err && <p role="alert" className="px-3 pt-2 text-xs font-medium text-red-700">{err}</p>}
              <form onSubmit={onSend} className="flex gap-2 border-t border-line p-3">
                <input value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} placeholder="Type a message…" aria-label="Message" className={input} disabled={busy} />
                <button type="submit" disabled={busy} aria-label="Send" className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold-500 text-navy-950 disabled:opacity-60"><Send className="size-4" /></button>
              </form>
            </>
          ) : (
            <form onSubmit={onStart} className="space-y-3 overflow-y-auto p-4">
              <p className="text-sm text-muted">Ask us anything about your visa plan. No account needed.</p>
              {err && <p role="alert" className="text-xs font-medium text-red-700">{err}</p>}
              <div><label htmlFor="cw-name" className="mb-1 block text-xs font-semibold">Your name</label><input id="cw-name" name="name" required minLength={2} maxLength={80} autoComplete="name" className={input} />{fields.name?.map((m) => <p key={m} className="mt-1 text-xs text-red-700">{m}</p>)}</div>
              <div><label htmlFor="cw-contact" className="mb-1 block text-xs font-semibold">WhatsApp number <span className="font-normal text-muted">(optional)</span></label><input id="cw-contact" name="contact" type="tel" maxLength={40} autoComplete="tel" className={input} />{fields.contact?.map((m) => <p key={m} className="mt-1 text-xs text-red-700">{m}</p>)}</div>
              <div><label htmlFor="cw-msg" className="mb-1 block text-xs font-semibold">Your message</label><textarea id="cw-msg" name="message" required maxLength={1000} rows={3} className={input} />{fields.message?.map((m) => <p key={m} className="mt-1 text-xs text-red-700">{m}</p>)}</div>
              <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
              <button type="submit" disabled={busy} className="w-full rounded-xl bg-gold-500 px-4 py-2.5 text-sm font-bold text-navy-950 disabled:opacity-60">{busy ? "Starting…" : "Start chat"}</button>
              <p className="text-[11px] leading-snug text-muted">By chatting you agree to our <a href="/privacy" target="_blank" className="underline">Privacy Policy</a>. Please do not share passport or card details here.</p>
            </form>
          )}
        </section>
      )}
    </>
  );
}
