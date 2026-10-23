import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Online-payment provider adapter.
 *
 * NO real provider is implemented: none has approved the business yet. Until
 * an adapter is added to REGISTRY AND PAYMENT_PROVIDER names it, the webhook
 * route answers 404 and payments stay manual bank transfer.
 *
 * An adapter must verify the provider's signature over the RAW body and
 * return a normalised event, or null if verification fails. It must never
 * trust any amount or status that arrives without a valid signature.
 */
export interface ProviderEvent {
  /** Provider's unique event id — the idempotency key. */
  eventId: string;
  type: "payment.succeeded" | "payment.failed" | "other";
  /** Our booking reference (360-XXXXXXXX) echoed back by the provider. */
  bookingReference: string;
  providerPaymentId: string;
  amountPkr: number;
  currency: string;
}

export interface PaymentProvider {
  name: string;
  verifyAndParse(rawBody: string, headers: Headers): ProviderEvent | null;
}

/** Add real adapters here once a provider approves the business. */
const REGISTRY: Record<string, () => PaymentProvider> = {};

let override: PaymentProvider | null | undefined;
export function setPaymentProviderForTests(p: PaymentProvider | null | undefined) {
  override = p;
}

export function getPaymentProvider(): PaymentProvider | null {
  if (override !== undefined) return override;
  const name = (process.env.PAYMENT_PROVIDER ?? "").trim().toLowerCase();
  return name && REGISTRY[name] ? REGISTRY[name]() : null;
}

/** Constant-time HMAC-SHA256 hex check, for adapters that sign with a shared secret. */
export function verifyHmacSha256(secret: string, rawBody: string, signatureHex: string | null): boolean {
  if (!secret || !signatureHex) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest();
  let given: Buffer;
  try {
    given = Buffer.from(signatureHex.trim(), "hex");
  } catch {
    return false;
  }
  return given.length === expected.length && timingSafeEqual(given, expected);
}
