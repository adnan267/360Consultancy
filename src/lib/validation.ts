import { z } from "zod";

const slug = z.string().regex(/^[a-z0-9-]{1,60}$/, "Invalid selection");

/** Pakistan Standard Time is UTC+5 with no daylight saving. */
const PKT_OFFSET = "+05:00";
const MAX_DAYS_AHEAD = 90;

export function preferredToIso(date: string, time: string): string {
  return new Date(`${date}T${time}:00${PKT_OFFSET}`).toISOString();
}

/**
 * Public booking request. strictObject: unknown keys (e.g. a browser-supplied
 * "fee" or "price") are REJECTED, so a client can never smuggle in pricing.
 * No passport numbers, ID uploads or other sensitive data are accepted.
 */
export const bookingRequestSchema = z
  .strictObject({
    fullName: z.string().trim().min(2, "Please enter your full name").max(100),
    email: z.email("Please enter a valid email").max(254).transform((v) => v.toLowerCase()),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9\s\-()]{7,20}$/, "Please enter a valid phone / WhatsApp number"),
    countrySlug: slug,
    serviceSlug: slug,
    preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date"),
    preferredTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Choose a time"),
    message: z.string().trim().max(1000, "Please keep your message under 1000 characters").default(""),
    consentPrivacy: z.literal(true, { error: "You must accept the Privacy Policy" }),
    consentTerms: z.literal(true, { error: "You must acknowledge the Terms and Refund Policy" }),
    /** Honeypot — real users never fill this in. */
    website: z.string().max(200).optional().default(""),
  })
  .superRefine((v, ctx) => {
    const when = new Date(`${v.preferredDate}T${v.preferredTime}:00${PKT_OFFSET}`);
    if (Number.isNaN(when.getTime())) {
      ctx.addIssue({ code: "custom", path: ["preferredDate"], message: "Choose a valid date and time" });
      return;
    }
    const now = Date.now();
    if (when.getTime() < now + 60 * 60 * 1000) {
      ctx.addIssue({ code: "custom", path: ["preferredDate"], message: "Please choose a time at least one hour from now" });
    }
    if (when.getTime() > now + MAX_DAYS_AHEAD * 86_400_000) {
      ctx.addIssue({ code: "custom", path: ["preferredDate"], message: `Please choose a date within ${MAX_DAYS_AHEAD} days` });
    }
  });

export type BookingRequestInput = z.infer<typeof bookingRequestSchema>;

export const loginSchema = z.strictObject({
  email: z.email().max(254).transform((v) => v.toLowerCase()),
  password: z.string().min(1).max(200),
});

const note = z.string().trim().min(1).max(2000);

export const adminBookingActionSchema = z.discriminatedUnion("action", [
  z.strictObject({
    action: z.literal("set_status"),
    status: z.enum(["request_received", "awaiting_payment", "payment_under_review", "confirmed", "in_progress", "completed", "cancelled"]),
    note: note.optional(),
  }),
  z.strictObject({
    action: z.literal("update_payment"),
    status: z.enum(["under_review", "verified", "rejected", "refunded"]),
    bankReference: z.string().trim().min(3).max(100).optional(),
    receivedAmountPkr: z.number().int().min(0).max(100_000_000).optional(),
    note: note.optional(),
  }),
  z.strictObject({ action: z.literal("add_note"), note }),
]);
export type AdminBookingAction = z.infer<typeof adminBookingActionSchema>;

export const servicePatchSchema = z.strictObject({
  title: z.string().trim().min(2).max(120).optional(),
  summary: z.string().trim().min(2).max(300).optional(),
  fee_pkr: z.number().int().min(0).max(10_000_000).optional(),
  fee_is_starting_price: z.boolean().optional(),
  fee_needs_review: z.boolean().optional(),
  is_active: z.boolean().optional(),
});
export type ServicePatch = z.infer<typeof servicePatchSchema>;

export const bookingFilterSchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.enum(["request_received", "awaiting_payment", "payment_under_review", "confirmed", "in_progress", "completed", "cancelled"]).optional(),
  paymentStatus: z.enum(["awaiting", "under_review", "verified", "rejected", "refunded"]).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
});

// ── Client portal ───────────────────────────────────────────────────────────
import { CASE_PURPOSES, CASE_STAGES, DOC_TYPES } from "./types";

export const clientRegisterSchema = z.strictObject({
  fullName: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.email("Please enter a valid email").max(254).transform((v) => v.toLowerCase()),
  phone: z.string().trim().regex(/^\+?[0-9\s\-()]{7,20}$/, "Please enter a valid phone / WhatsApp number").optional().or(z.literal("").transform(() => undefined)),
  // bcrypt only uses the first 72 bytes, so longer passwords would be silently truncated
  password: z.string().min(10, "Use at least 10 characters").max(72, "Use at most 72 characters"),
  consentPrivacy: z.literal(true, { error: "You must accept the Privacy Policy" }),
  consentTerms: z.literal(true, { error: "You must accept the Terms" }),
  website: z.string().max(200).optional().default(""),
});

export const clientLoginSchema = z.strictObject({ email: z.email().max(254), password: z.string().min(1).max(200) });

export const createCaseSchema = z.strictObject({ countrySlug: z.string().regex(/^[a-z-]{2,40}$/), purpose: z.enum(CASE_PURPOSES) });

export const clientCaseActionSchema = z.discriminatedUnion("action", [
  z.strictObject({ action: z.literal("mark_paid"), stage: z.enum(CASE_STAGES), clientReference: z.string().trim().max(80).optional() }),
  z.strictObject({ action: z.literal("request_review") }),
  z.strictObject({ action: z.literal("accept_quote") }),
  z.strictObject({ action: z.literal("cancel") }),
]);
export type ClientCaseAction = z.infer<typeof clientCaseActionSchema>;

export const uploadMetaSchema = z.strictObject({ docType: z.enum(DOC_TYPES) });

export const adminCaseActionSchema = z.discriminatedUnion("action", [
  z.strictObject({ action: z.literal("verify_payment"), stage: z.enum(CASE_STAGES), bankReference: z.string().trim().min(3).max(80), receivedAmountPkr: z.number().int().min(0).max(100_000_000) }),
  z.strictObject({ action: z.literal("reject_payment"), stage: z.enum(CASE_STAGES), note: z.string().trim().min(3).max(500) }),
  z.strictObject({ action: z.literal("refund_payment"), stage: z.enum(CASE_STAGES), note: z.string().trim().max(500).optional() }),
  z.strictObject({ action: z.literal("set_document_status"), documentId: z.uuid(), status: z.enum(["accepted", "needs_fix"]), note: z.string().trim().max(500).optional() }),
  z.strictObject({ action: z.literal("request_fixes"), note: z.string().trim().min(3).max(1000) }),
  z.strictObject({ action: z.literal("complete_review"), report: z.string().trim().min(20, "Write the review report").max(8000), quotePkr: z.number().int().min(1).max(10_000_000) }),
  z.strictObject({ action: z.literal("record_submission"), reference: z.string().trim().min(3).max(120), notes: z.string().trim().max(1000).optional() }),
  z.strictObject({ action: z.literal("cancel"), note: z.string().trim().min(3).max(500) }),
  z.strictObject({ action: z.literal("add_note"), note: z.string().trim().min(1).max(1000) }),
]);
export type AdminCaseAction = z.infer<typeof adminCaseActionSchema>;

export const changePasswordSchema = z.strictObject({
  current_password: z.string().min(1).max(200),
  new_password: z.string().min(12, "Use at least 12 characters").max(200),
});

// ── Site settings (admin-editable) ──────────────────────────────────────────
const plainEmail = z.string().trim().toLowerCase().max(254).pipe(z.email());
export const settingsPatchSchema = z.strictObject({
  seo_title: z.string().trim().max(70).optional(),
  seo_description: z.string().trim().max(200).optional(),
  /** Address emails are sent FROM. Empty = fall back to EMAIL_FROM env. Must belong to a domain verified with the email provider. */
  mail_from: z.union([z.literal(""), plainEmail]).optional(),
  /** Addresses that RECEIVE admin alerts (new bookings, leads, cases). */
  notify_emails: z.array(plainEmail).max(10).transform((a) => [...new Set(a)]).optional(),
});
export type SettingsPatch = z.infer<typeof settingsPatchSchema>;

export const forgotPasswordSchema = z.strictObject({ email: z.email().max(254).transform((v) => v.toLowerCase()) });
export const resetPasswordSchema = z.strictObject({
  token: z.string().min(20).max(100),
  password: z.string().min(10, "Use at least 10 characters").max(72, "Use at most 72 characters"),
});
export const tokenOnlySchema = z.strictObject({ token: z.string().min(20).max(100) });

export const faqSchema = z.strictObject({
  question: z.string().trim().min(3).max(300),
  answer: z.string().trim().min(3).max(4000),
  sort_order: z.number().int().min(0).max(10_000).optional(),
  is_published: z.boolean().optional(),
});
export const faqPatchSchema = faqSchema.partial();

export const blogSchema = z.strictObject({
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{1,80}$/, "Use lowercase letters, numbers and hyphens only"),
  title: z.string().trim().min(3).max(160),
  excerpt: z.string().trim().max(300).default(""),
  body: z.string().max(60_000).default(""),
  meta_title: z.string().trim().max(70).nullable().optional(),
  meta_description: z.string().trim().max(200).nullable().optional(),
  is_published: z.boolean().default(false),
});
export const blogPatchSchema = blogSchema.partial();

export const caseMessageSchema = z.strictObject({ body: z.string().trim().min(1, "Write a message").max(2000) });
export const staffMessageSchema = z.strictObject({ body: z.string().trim().min(1).max(2000), internal: z.boolean().default(false) });
export const dataRequestSchema = z.strictObject({ kind: z.enum(["export", "delete"]), note: z.string().trim().max(1000).optional() });
export const dataRequestPatchSchema = z.strictObject({ status: z.enum(["done", "rejected"]) });
export const teamPatchSchema = z.strictObject({ role: z.enum(["admin", "staff", "consultant", "finance", "support"]).optional(), is_active: z.boolean().optional() });
