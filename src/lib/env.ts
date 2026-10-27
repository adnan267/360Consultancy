/**
 * Environment accessors. Functions (not constants) so tests can change
 * process.env between cases and so nothing is frozen at import time.
 * SERVER-ONLY values must never be imported from client components.
 */

/** Server-side feature flag. Anything other than the exact string "true" is OFF. */
export function servicesEnabled(): boolean {
  return process.env.SERVICES_ENABLED === "true";
}

/** Lead capture (wizard "save my details"). Separate flag; OFF unless exactly "true". */
export function leadsEnabled(): boolean {
  return process.env.LEADS_ENABLED === "true";
}

/** Client portal (accounts, uploads, staged payments). Needs SERVICES_ENABLED too. OFF unless exactly "true". */
export function portalEnabled(): boolean {
  return process.env.PORTAL_ENABLED === "true" && servicesEnabled();
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://360consultancy.pk").replace(/\/$/, "");
}

export function supabaseConfig(): { url: string; serviceKey: string } | null {
  const url = process.env.SUPABASE_URL?.trim();
  // Prefer the new-style secret key (sb_secret_...), fall back to the legacy service_role JWT.
  const serviceKey = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim();
  if (!url || !serviceKey) return null;
  return { url, serviceKey };
}

export function sessionSecret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error("SESSION_SECRET must be set to a random string of at least 32 characters.");
  }
  return new TextEncoder().encode(s);
}

export function bankDetails() {
  const d = {
    accountTitle: process.env.BANK_ACCOUNT_TITLE ?? "",
    bankName: process.env.BANK_NAME ?? "",
    accountNumber: process.env.BANK_ACCOUNT_NUMBER ?? "",
    iban: process.env.BANK_IBAN ?? "",
    branch: process.env.BANK_BRANCH ?? "",
  };
  const configured = Boolean(d.accountTitle && d.bankName && (d.accountNumber || d.iban));
  return { ...d, configured };
}

/** NOWPayments (crypto gateway). Enabled only when both the API key and the IPN secret are set. */
export function nowPaymentsConfig() {
  const apiKey = process.env.NOWPAYMENTS_API_KEY?.trim();
  const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET?.trim();
  if (!apiKey || !ipnSecret) return null;
  const clean = (v: string | undefined) => (v ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const priceCurrency = clean(process.env.NOWPAYMENTS_PRICE_CURRENCY) || "pkr";
  if (priceCurrency !== "pkr" && priceCurrency !== "usd") return null; // refuse a malformed value rather than charge in the wrong currency
  const pkrPerUsd = Number(process.env.PKR_PER_USD) || 0;
  if (priceCurrency === "usd" && pkrPerUsd <= 0) return null; // USD pricing needs an explicit rate
  return {
    apiKey,
    ipnSecret,
    priceCurrency,
    pkrPerUsd,
    payCurrency: clean(process.env.NOWPAYMENTS_PAY_CURRENCY),
    apiBase: process.env.NOWPAYMENTS_API_BASE?.trim() || "https://api.nowpayments.io",
  };
}
