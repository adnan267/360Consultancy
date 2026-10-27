"use client";

import Script from "next/script";
import { useCallback, useEffect, useState } from "react";
import { Button } from "./ui";

type Choice = "accepted" | "declined" | null;
const KEY = "cookie-consent-v1";
const GA = process.env.NEXT_PUBLIC_GA_ID?.trim() ?? "";
const gaOk = /^G-[A-Z0-9]{4,20}$/.test(GA);

function readChoice(): Choice {
  try { const v = localStorage.getItem(KEY); return v === "accepted" || v === "declined" ? v : null; } catch { return null; }
}

/**
 * Cookie preferences + Google Analytics. Analytics loads ONLY after the visitor accepts.
 * With no GA ID configured there are no non-essential cookies, and the panel just says so.
 */
export function CookieConsent() {
  const [choice, setChoice] = useState<Choice>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const c = readChoice();
    setChoice(c);
    if (c === null && gaOk) setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener("open-cookie-prefs", reopen);
    return () => window.removeEventListener("open-cookie-prefs", reopen);
  }, []);
  const save = useCallback((c: Exclude<Choice, null>) => {
    try { localStorage.setItem(KEY, c); } catch { /* storage unavailable: choice lasts this visit only */ }
    setChoice(c); setOpen(false);
  }, []);
  return (
    <>
      {gaOk && choice === "accepted" && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA}',{anonymize_ip:true});`}</Script>
        </>
      )}
      {open && (
        <div role="dialog" aria-modal="false" aria-labelledby="cookie-title" className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-xl rounded-2xl border border-line bg-white p-5 shadow-2xl sm:bottom-5">
          <h2 id="cookie-title" className="font-bold text-navy-900">Cookie preferences</h2>
          {gaOk ? (
            <>
              <p className="mt-2 text-sm text-muted">We use essential cookies to run the site. With your permission we also use analytics cookies to understand which pages are useful. Analytics never loads unless you accept.</p>
              <div className="mt-4 flex flex-wrap gap-3"><Button variant="dark" onClick={() => save("accepted")}>Accept analytics</Button><Button variant="secondary" onClick={() => save("declined")}>Essential only</Button></div>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted">This site currently uses only essential cookies (for example, to keep you signed in). No analytics or advertising cookies are set.</p>
              <div className="mt-4"><Button variant="secondary" onClick={() => setOpen(false)}>Close</Button></div>
            </>
          )}
        </div>
      )}
    </>
  );
}

/** Footer button that reopens the preferences panel. */
export function CookiePrefsButton({ className }: { className?: string }) {
  return <button type="button" className={className} onClick={() => window.dispatchEvent(new Event("open-cookie-prefs"))}>Cookie preferences</button>;
}
