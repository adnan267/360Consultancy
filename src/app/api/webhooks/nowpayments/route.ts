import { nowPaymentsConfig } from "@/lib/env";
import { applyNowPaymentsIpn } from "@/lib/cases";
import { verifyIpn } from "@/lib/payments/nowpayments";
import { isDatabaseConfigured } from "@/lib/repo";
import { json, jsonError } from "@/lib/security";

/** NOWPayments → us (IPN). Authenticity comes only from the HMAC-SHA512 signature; no browser origin check. */
export async function POST(req: Request) {
  const cfg = nowPaymentsConfig();
  if (!cfg) return jsonError(404, "Not found");
  if (!isDatabaseConfigured()) return jsonError(503, "Unavailable");
  const raw = await req.text();
  if (raw.length > 32_000) return jsonError(413, "Payload too large");
  const ev = verifyIpn(raw, req.headers.get("x-nowpayments-sig"), cfg.ipnSecret);
  if (!ev) return jsonError(401, "Invalid signature");
  try {
    return json({ ok: true, outcome: await applyNowPaymentsIpn(ev) });
  } catch (e) {
    console.error("[webhook/nowpayments]", e);
    return jsonError(500, "Processing failed"); // NOWPayments retries; handling is idempotent
  }
}
