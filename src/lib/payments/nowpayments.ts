import { createHmac, timingSafeEqual } from "node:crypto";
import { nowPaymentsConfig } from "../env";

export const nowPaymentsEnabled = () => nowPaymentsConfig() !== null;

/** NOWPayments signs the JSON body with its keys sorted alphabetically (recursively). */
function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === "object") {
    return Object.fromEntries(Object.entries(v as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([k, x]) => [k, sortKeys(x)]));
  }
  return v;
}

export interface NowPaymentsIpn {
  payment_id?: string | number;
  payment_status?: string;
  invoice_id?: string | number;
  order_id?: string;
  price_amount?: string | number;
  price_currency?: string;
  actually_paid?: string | number;
  pay_amount?: string | number;
}

/** Returns the parsed IPN only when the HMAC-SHA512 signature is valid. */
export function verifyIpn(rawBody: string, signature: string | null, secret: string): NowPaymentsIpn | null {
  if (!secret || !signature) return null;
  let parsed: unknown;
  try { parsed = JSON.parse(rawBody); } catch { return null; }
  if (!parsed || typeof parsed !== "object") return null;
  const expected = createHmac("sha512", secret).update(JSON.stringify(sortKeys(parsed))).digest();
  let given: Buffer;
  try { given = Buffer.from(signature.trim().toLowerCase(), "hex"); } catch { return null; }
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  return parsed as NowPaymentsIpn;
}

export interface InvoiceInput { orderId: string; description: string; priceAmount: number; priceCurrency: string; payCurrency: string; callbackUrl: string; successUrl: string; cancelUrl: string }

export async function createInvoice(inp: InvoiceInput): Promise<{ id: string; url: string } | { error: string }> {
  const cfg = nowPaymentsConfig();
  if (!cfg) return { error: "Online payment is not available right now." };
  try {
    const res = await fetch(`${cfg.apiBase}/v1/invoice`, {
      method: "POST",
      headers: { "x-api-key": cfg.apiKey, "content-type": "application/json" },
      body: JSON.stringify({
        price_amount: inp.priceAmount,
        price_currency: inp.priceCurrency,
        ...(inp.payCurrency ? { pay_currency: inp.payCurrency } : {}),
        order_id: inp.orderId,
        order_description: inp.description,
        ipn_callback_url: inp.callbackUrl,
        success_url: inp.successUrl,
        cancel_url: inp.cancelUrl,
        is_fixed_rate: true,
        is_fee_paid_by_user: false,
      }),
      signal: AbortSignal.timeout(12_000),
    });
    const data = (await res.json().catch(() => ({}))) as { id?: string | number; invoice_url?: string; message?: string };
    if (!res.ok || !data.id || !data.invoice_url) {
      console.error("[nowpayments] invoice failed", res.status, data.message);
      return { error: "Could not start the online payment. Please try again or contact us." };
    }
    const host = new URL(data.invoice_url).hostname;
    if (host !== "nowpayments.io" && !host.endsWith(".nowpayments.io")) return { error: "Unexpected payment page. Please contact us." };
    return { id: String(data.id), url: data.invoice_url };
  } catch (e) {
    console.error("[nowpayments] invoice error", e);
    return { error: "Could not reach the payment service. Please try again." };
  }
}
