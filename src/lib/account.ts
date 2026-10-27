import { createHash, randomBytes } from "node:crypto";
import { hashPassword } from "./auth";
import type { Result } from "./bookings";
import { emailEnabled, sendPlainEmail } from "./email";
import { portalEnabled, siteUrl } from "./env";
import { getRepo, isDatabaseConfigured } from "./repo";
import { forgotPasswordSchema, resetPasswordSchema, tokenOnlySchema } from "./validation";

const fail = (status: number, error: string) => ({ ok: false as const, status, error });
const VERIFY_TTL_MS = 24 * 3600_000;
const RESET_TTL_MS = 60 * 60_000;

export const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");
const newToken = () => randomBytes(32).toString("base64url");

function gate() {
  if (!portalEnabled()) return fail(503, "The client portal is not open yet.");
  if (!isDatabaseConfigured()) return fail(503, "The client portal is temporarily unavailable.");
  return null;
}

/** Email verification is enforced only once a real email provider exists, so the portal never locks everyone out. */
export function verificationRequired(): boolean {
  return emailEnabled();
}

/** Issues a verification link and emails it. Best-effort: never throws. */
export async function sendVerificationEmail(client: { id: string; email: string; full_name: string }): Promise<boolean> {
  if (!emailEnabled()) return false;
  try {
    const token = newToken();
    await getRepo().issueClientToken(client.id, "verify", hashToken(token), new Date(Date.now() + VERIFY_TTL_MS));
    const r = await sendPlainEmail(
      client.email,
      "Verify your email — 360 Consultancy",
      `Dear ${client.full_name},\n\nPlease confirm your email address to continue using your client portal:\n\n${siteUrl()}/portal/verify?token=${token}\n\nThis link is valid for 24 hours. If you did not create an account, you can ignore this email.`,
    );
    return r.sent;
  } catch (e) {
    console.error("[sendVerificationEmail]", e);
    return false;
  }
}

export async function resendVerification(clientId: string, ip: string): Promise<Result<{ sent: boolean }>> {
  const g = gate();
  if (g) return g;
  const repo = getRepo();
  if (!(await repo.hitRateLimit(`verify:resend:${clientId}`, 3, 3600)) || !(await repo.hitRateLimit(`verify:resend:ip:${ip}`, 10, 3600))) return fail(429, "Too many requests. Please try again later.");
  const c = await repo.getClientById(clientId);
  if (!c || !c.is_active) return fail(401, "Please sign in");
  if (c.email_verified_at) return { ok: true, sent: false };
  if (!emailEnabled()) return fail(503, "Email is not available right now. Please contact us.");
  return { ok: true, sent: await sendVerificationEmail(c) };
}

export async function verifyEmail(input: unknown, ip: string): Promise<Result<object>> {
  const g = gate();
  if (g) return g;
  const repo = getRepo();
  if (!(await repo.hitRateLimit(`verify:ip:${ip}`, 20, 3600))) return fail(429, "Too many attempts. Please try again later.");
  const p = tokenOnlySchema.safeParse(input);
  if (!p.success) return fail(400, "This link is not valid.");
  const clientId = await repo.consumeClientToken("verify", hashToken(p.data.token));
  if (!clientId) return fail(400, "This link is invalid or has expired. Request a new one from your portal.");
  await repo.markClientVerified(clientId);
  return { ok: true };
}

/** Always answers the same way so the form cannot be used to discover which emails have accounts. */
export async function requestPasswordReset(input: unknown, ip: string): Promise<Result<{ emailAvailable: boolean }>> {
  const g = gate();
  if (g) return g;
  const repo = getRepo();
  const p = forgotPasswordSchema.safeParse(input);
  if (!p.success) return fail(422, "Please enter a valid email address.");
  if (!(await repo.hitRateLimit(`reset:ip:${ip}`, 8, 3600)) || !(await repo.hitRateLimit(`reset:email:${p.data.email}`, 3, 3600))) return fail(429, "Too many requests. Please try again later.");
  if (!emailEnabled()) return { ok: true, emailAvailable: false };
  const c = await repo.getClientByEmail(p.data.email);
  if (c && c.is_active) {
    try {
      const token = newToken();
      await repo.issueClientToken(c.id, "reset", hashToken(token), new Date(Date.now() + RESET_TTL_MS));
      await sendPlainEmail(c.email, "Reset your password — 360 Consultancy", `Dear ${c.full_name},\n\nWe received a request to reset your portal password. Use this link within 1 hour:\n\n${siteUrl()}/portal/reset?token=${token}\n\nIf you did not ask for this, ignore this email — your password will not change.`);
    } catch (e) {
      console.error("[requestPasswordReset]", e);
    }
  }
  return { ok: true, emailAvailable: true };
}

export async function resetPassword(input: unknown, ip: string): Promise<Result<object>> {
  const g = gate();
  if (g) return g;
  const repo = getRepo();
  if (!(await repo.hitRateLimit(`reset:confirm:ip:${ip}`, 10, 3600))) return fail(429, "Too many attempts. Please try again later.");
  const p = resetPasswordSchema.safeParse(input);
  if (!p.success) return fail(422, p.error.issues[0]?.message ?? "Please check your new password.");
  const clientId = await repo.consumeClientToken("reset", hashToken(p.data.token));
  if (!clientId) return fail(400, "This link is invalid or has expired. Please request a new one.");
  await repo.setClientPassword(clientId, await hashPassword(p.data.password));
  await repo.markClientVerified(clientId); // they proved control of the mailbox
  await repo.appendAudit({ booking_id: null, actor_id: clientId, actor_label: "client", action: "client_password_reset", from_value: null, to_value: null, meta: {} });
  return { ok: true };
}
