import { notifyAdmins } from "./email";
import { leadsEnabled } from "./env";
import { getRepo, isDatabaseConfigured } from "./repo";
import { leadRequestSchema, suggest } from "./wizard";
import type { Result } from "./bookings";

const fail = (status: number, error: string, fields?: Record<string, string[]>) => ({ ok: false as const, status, error, fields });

/** Saves a wizard lead. Server re-validates everything and recomputes suggestions; nothing client-derived is trusted. */
export async function createLead(input: unknown, ctx: { ip: string }): Promise<Result<{ suggestedServices: string[] }>> {
  if (!leadsEnabled()) return fail(503, "Saving details is not available yet. You can still use the suggestions on this page.");
  if (!isDatabaseConfigured()) return fail(503, "Saving details is temporarily unavailable.");
  const repo = getRepo();

  if (!(await repo.hitRateLimit(`lead:ip:${ctx.ip}`, 5, 3600))) return fail(429, "Too many requests. Please try again later.");

  const parsed = leadRequestSchema.safeParse(input);
  if (!parsed.success) {
    const fields: Record<string, string[]> = {};
    for (const i of parsed.error.issues) (fields[String(i.path.at(-1) ?? "form")] ??= []).push(i.message);
    return fail(422, "Please check the highlighted fields.", fields);
  }
  const { answers, contact } = parsed.data;

  if (contact.website) return { ok: true, suggestedServices: [] }; // honeypot: pretend success

  if (!(await repo.hitRateLimit(`lead:email:${contact.email}`, 3, 86_400))) return fail(429, "Too many requests for this email. Please try again later.");

  const s = suggest(answers);
  await repo.insertLead({
    name: contact.name,
    email: contact.email,
    phone: contact.phone ?? null,
    purpose: answers.purpose,
    destination: answers.destination,
    answers,
    suggested_services: s.serviceSlugs,
  });
  await notifyAdmins("New lead from the website", `${contact.name} saved their details (${answers.purpose} → ${answers.destination}). View it under Leads in the admin panel.`);
  return { ok: true, suggestedServices: s.serviceSlugs };
}
