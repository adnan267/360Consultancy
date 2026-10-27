import { bankDetails, siteUrl } from "./env";
import { formatPkr } from "./pricing";
import { getSiteSettings } from "./settings";
import { BOOKING_STATUS_LABEL, type BookingStatus } from "./types";

export interface EmailMessage {
  /** Optional sender override (from admin settings). Falls back to EMAIL_FROM. */
  from?: string;
  to: string;
  subject: string;
  text: string;
}
export interface SendResult {
  sent: boolean;
  reason?: string;
}
export interface EmailProvider {
  readonly name: string;
  send(msg: EmailMessage): Promise<SendResult>;
}

/** Used whenever no provider credentials exist. Never claims to have sent anything. */
class DisabledProvider implements EmailProvider {
  readonly name = "disabled";
  async send(): Promise<SendResult> {
    return { sent: false, reason: "Email provider is not configured" };
  }
}

/** Resend REST adapter. Only active when EMAIL_PROVIDER=resend and credentials are set. UNTESTED against the live API. */
class ResendProvider implements EmailProvider {
  readonly name = "resend";
  constructor(private apiKey: string, private from: string) {}
  async send(msg: EmailMessage): Promise<SendResult> {
    const from = msg.from || this.from;
    if (!from) return { sent: false, reason: "No sender address configured" };
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [msg.to], subject: msg.subject, text: msg.text }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) return { sent: false, reason: `Provider responded ${res.status}` };
      return { sent: true };
    } catch (e) {
      return { sent: false, reason: e instanceof Error ? e.message : "send failed" };
    }
  }
}

let testProvider: EmailProvider | null = null;
export function setEmailProviderForTests(p: EmailProvider | null) {
  testProvider = p;
}

export function getEmailProvider(): EmailProvider {
  if (testProvider) return testProvider;
  const kind = process.env.EMAIL_PROVIDER;
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  // A sender may also come from admin settings at send time, so EMAIL_FROM is optional here.
  if (kind === "resend" && key) return new ResendProvider(key, from ?? "");
  return new DisabledProvider();
}

export interface NotificationContext {
  reference: string;
  fullName: string;
  email: string;
  serviceTitle: string;
  feePkr: number;
  preferredAt: string;
  status?: BookingStatus;
}

export type NotificationKind =
  | "booking_received"
  | "payment_instructions"
  | "payment_verified"
  | "appointment_confirmed"
  | "status_updated";

const FOOTER = `\n\n—\n360 Consultancy · ${siteUrl()}\nWe provide guidance only. Final visa decisions remain with the relevant authorities and no outcome is guaranteed.`;

export function paymentInstructionsText(ctx: NotificationContext): { text: string } | { error: string } {
  const bank = bankDetails();
  if (!bank.configured) return { error: "Bank details are not configured" };
  const lines = [
    `Amount to pay: ${formatPkr(ctx.feePkr)} (consultancy fee only; government/embassy fees are paid separately to the authority)`,
    `Account title: ${bank.accountTitle}`,
    `Bank: ${bank.bankName}`,
    bank.accountNumber && `Account number: ${bank.accountNumber}`,
    bank.iban && `IBAN: ${bank.iban}`,
    bank.branch && `Branch: ${bank.branch}`,
    `Payment reference (include this in your transfer): ${ctx.reference}`,
    "",
    "Your booking is confirmed only after we have checked the payment in our bank account records. A screenshot alone does not confirm a booking.",
  ].filter((l): l is string => typeof l === "string");
  return { text: lines.join("\n") };
}

export function buildMessage(kind: NotificationKind, ctx: NotificationContext): EmailMessage | { error: string } {
  const hi = `Dear ${ctx.fullName},\n\n`;
  const when = new Date(ctx.preferredAt).toLocaleString("en-GB", { timeZone: "Asia/Karachi", dateStyle: "full", timeStyle: "short" });
  switch (kind) {
    case "booking_received":
      return {
        to: ctx.email,
        subject: `We received your request (${ctx.reference})`,
        text: `${hi}Thank you for your request for "${ctx.serviceTitle}" (preferred time: ${when} PKT).\n\nReference: ${ctx.reference}\n\nThis is a request, not a confirmed appointment. We will review it and send payment instructions. Please do not pay until you receive them.${FOOTER}`,
      };
    case "payment_instructions": {
      const p = paymentInstructionsText(ctx);
      if ("error" in p) return p;
      return {
        to: ctx.email,
        subject: `Payment instructions (${ctx.reference})`,
        text: `${hi}Your request ${ctx.reference} for "${ctx.serviceTitle}" has been accepted for payment.\n\n${p.text}${FOOTER}`,
      };
    }
    case "payment_verified":
      return {
        to: ctx.email,
        subject: `Payment verified (${ctx.reference})`,
        text: `${hi}We have verified your payment for ${ctx.reference}. We will confirm your appointment shortly.${FOOTER}`,
      };
    case "appointment_confirmed":
      return {
        to: ctx.email,
        subject: `Booking confirmed (${ctx.reference})`,
        text: `${hi}Your booking ${ctx.reference} for "${ctx.serviceTitle}" is confirmed for ${when} PKT.${FOOTER}`,
      };
    case "status_updated":
      return {
        to: ctx.email,
        subject: `Booking update (${ctx.reference})`,
        text: `${hi}The status of your booking ${ctx.reference} is now: ${BOOKING_STATUS_LABEL[ctx.status ?? "request_received"]}.${FOOTER}`,
      };
  }
}

/** Builds and attempts to send. Never throws; result is recorded in the audit log by the caller. */
export async function sendNotification(kind: NotificationKind, ctx: NotificationContext): Promise<SendResult> {
  const msg = buildMessage(kind, ctx);
  if ("error" in msg) return { sent: false, reason: msg.error };
  return deliver(msg);
}

/** True when a real email provider is configured. Account-verification rules only apply when this is true. */
export function emailEnabled(): boolean {
  return getEmailProvider().name !== "disabled";
}

/** Sends a plain transactional email (account emails, alerts). Never throws. */
export async function sendPlainEmail(to: string, subject: string, text: string): Promise<SendResult> {
  return deliver({ to, subject, text: `${text}${FOOTER}` });
}

async function deliver(msg: EmailMessage): Promise<SendResult> {
  try {
    const settings = await getSiteSettings();
    return await getEmailProvider().send(settings.mail_from ? { ...msg, from: settings.mail_from } : msg);
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : "send failed" };
  }
}

/** Alerts every configured receiving address (admin settings + ADMIN_NOTIFY_EMAIL). Never throws, never blocks the caller's result. */
export async function notifyAdmins(subject: string, text: string): Promise<void> {
  try {
    const settings = await getSiteSettings();
    const env = (process.env.ADMIN_NOTIFY_EMAIL ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
    const recipients = [...new Set([...settings.notify_emails, ...env])];
    await Promise.all(recipients.map((to) => deliver({ to, subject, text: `${text}\n\n—\n${siteUrl()}/admin` })));
  } catch (e) {
    console.error("[notifyAdmins]", e);
  }
}
