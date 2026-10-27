import { sendPlainEmail } from "./email";
import { getRepo } from "./repo";
import type { EmailTemplateKey } from "./types";

export const TEMPLATE_DEFAULTS: Record<EmailTemplateKey, { label: string; subject: string; body: string; vars: string[] }> = {
  case_status: {
    label: "Case status update",
    subject: "Update on your case {{reference}}",
    body: "Dear {{name}},\n\nThere is an update on your case {{reference}}. Its status is now: {{status}}.\n\nSign in to your portal to see details and any next steps: {{link}}",
    vars: ["name", "reference", "status", "link"],
  },
  payment_verified: {
    label: "Payment confirmed",
    subject: "Payment received for case {{reference}}",
    body: "Dear {{name}},\n\nWe have confirmed your payment for case {{reference}}. Your next step is waiting in your portal: {{link}}",
    vars: ["name", "reference", "link"],
  },
  deliverables_ready: {
    label: "Final files ready",
    subject: "Your files for case {{reference}} are ready",
    body: "Dear {{name}},\n\nYour completed files for case {{reference}} are ready to download from your portal: {{link}}\n\nPlease note that the final visa decision always rests with the relevant authority.",
    vars: ["name", "reference", "link"],
  },
  new_message: {
    label: "New message from consultant",
    subject: "New message on case {{reference}}",
    body: "Dear {{name}},\n\nYou have a new message on case {{reference}}. Read and reply in your portal: {{link}}",
    vars: ["name", "reference", "link"],
  },
};

/** Replaces {{var}} placeholders. Unknown placeholders are left empty; values are plain text (emails are sent as text). */
export function renderTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (_, k: string) => vars[k] ?? "");
}

/** Records an in-portal notification and emails the client, using the admin-edited template when one exists. Never throws. */
export async function notifyClient(opts: { clientId: string; clientEmail: string; caseId: string | null; templateKey: EmailTemplateKey; title: string; vars: Record<string, string>; link: string }): Promise<void> {
  try {
    const repo = getRepo();
    await repo.addNotification({ client_id: opts.clientId, case_id: opts.caseId, title: opts.title, body: "", link: opts.link });
    const custom = (await repo.listEmailTemplates()).find((t) => t.key === opts.templateKey);
    const t = custom ?? TEMPLATE_DEFAULTS[opts.templateKey];
    await sendPlainEmail(opts.clientEmail, renderTemplate(t.subject, opts.vars), renderTemplate(t.body, { ...opts.vars, link: opts.link }));
  } catch (e) {
    console.error("[notifyClient]", e);
  }
}
