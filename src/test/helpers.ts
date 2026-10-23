import { signSession } from "@/lib/auth";
import { MemoryRepo, setRepoForTests } from "@/lib/repo";
import { setEmailProviderForTests, type EmailMessage, type EmailProvider } from "@/lib/email";
import type { Role } from "@/lib/types";

export const ORIGIN = "https://360consultancy.pk";

export function freshRepo() {
  const repo = new MemoryRepo();
  setRepoForTests(repo);
  return repo;
}

export function futureParts(daysAhead = 3) {
  const d = new Date(Date.now() + daysAhead * 86_400_000 + 5 * 3600_000); // PKT date
  return { preferredDate: d.toISOString().slice(0, 10), preferredTime: "15:30" };
}

export function validBooking(over: Record<string, unknown> = {}) {
  return {
    fullName: "Ayesha Khan",
    email: "Ayesha@Example.com",
    phone: "+92 300 1234567",
    countrySlug: "canada",
    serviceSlug: "visa-guidance-session",
    ...futureParts(),
    message: "Hello",
    consentPrivacy: true,
    consentTerms: true,
    ...over,
  };
}

export class CapturingEmail implements EmailProvider {
  name = "capture";
  sent: EmailMessage[] = [];
  async send(m: EmailMessage) {
    this.sent.push(m);
    return { sent: true };
  }
}
export function captureEmail() {
  const p = new CapturingEmail();
  setEmailProviderForTests(p);
  return p;
}

export async function cookieFor(role: Role, sub = "11111111-1111-4111-8111-111111111111") {
  const token = await signSession({ sub, email: `${role}@example.com`, role });
  return `admin_session=${encodeURIComponent(token)}`;
}

export function req(method: string, url: string, opts: { body?: unknown; cookie?: string; origin?: string | null } = {}) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (opts.cookie) headers.cookie = opts.cookie;
  if (opts.origin !== null) headers.origin = opts.origin ?? ORIGIN;
  return new Request(`https://360consultancy.pk${url}`, { method, headers, body: opts.body === undefined ? undefined : JSON.stringify(opts.body) });
}
