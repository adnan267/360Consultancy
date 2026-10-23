import { getPaymentProvider } from "@/lib/payments/provider";
import { applyProviderEvent } from "@/lib/payments/webhook";
import { isDatabaseConfigured } from "@/lib/repo";
import { jsonError, json } from "@/lib/security";

const MAX = 64_000;

/** Provider → us. No browser origin check (server-to-server); authenticity comes from the provider signature. */
export async function POST(req: Request) {
  const provider = getPaymentProvider();
  if (!provider) return jsonError(404, "Not found");
  if (!isDatabaseConfigured()) return jsonError(503, "Unavailable");

  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX) return jsonError(413, "Payload too large");
  const raw = await req.text();
  if (raw.length > MAX) return jsonError(413, "Payload too large");

  let event;
  try {
    event = provider.verifyAndParse(raw, req.headers);
  } catch {
    event = null;
  }
  if (!event) return jsonError(401, "Invalid signature");

  try {
    const outcome = await applyProviderEvent(provider.name, event);
    // 200 for every processed event (including rejected amounts) so the provider does not retry forever.
    return json({ ok: true, outcome });
  } catch (e) {
    console.error("[webhook/payments]", e);
    return jsonError(500, "Processing failed"); // provider will retry; idempotency key makes that safe
  }
}
