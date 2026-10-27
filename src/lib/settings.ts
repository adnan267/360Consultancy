import { revalidateTag, unstable_cache } from "next/cache";
import { getRepo, isDatabaseConfigured } from "./repo";
import { site } from "./site";
import type { SettingsPatch } from "./validation";

export const SETTINGS_TAG = "site-settings";

export interface SiteSettings {
  seo_title: string;
  seo_description: string;
  /** Empty string = use EMAIL_FROM env. */
  mail_from: string;
  notify_emails: string[];
}

export const DEFAULT_SEO_TITLE = `${site.name} — Visa guidance you can understand`;

export function defaultSettings(): SiteSettings {
  return { seo_title: DEFAULT_SEO_TITLE, seo_description: site.description, mail_from: "", notify_emails: [] };
}

function fromRaw(raw: Record<string, unknown>): SiteSettings {
  const d = defaultSettings();
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  return {
    seo_title: str(raw.seo_title) || d.seo_title,
    seo_description: str(raw.seo_description) || d.seo_description,
    mail_from: str(raw.mail_from),
    notify_emails: Array.isArray(raw.notify_emails) ? raw.notify_emails.filter((e): e is string => typeof e === "string") : [],
  };
}

const cached = unstable_cache(async () => getRepo().getSettings(), ["site-settings-v1"], { tags: [SETTINGS_TAG], revalidate: 3600 });

/** Never throws: falls back to defaults if the database is unreachable or not configured. */
export async function getSiteSettings(): Promise<SiteSettings> {
  if (!isDatabaseConfigured()) return defaultSettings();
  try {
    return fromRaw(await cached());
  } catch (e) {
    console.error("[settings] read failed, using defaults", e);
    return defaultSettings();
  }
}

/** Uncached read for the admin form, so the editor always shows what is really stored. */
export async function getSiteSettingsFresh(): Promise<SiteSettings> {
  return fromRaw(await getRepo().getSettings());
}

export async function saveSiteSettings(patch: SettingsPatch, updatedBy: string): Promise<void> {
  const values: Record<string, unknown> = {};
  if (patch.seo_title !== undefined) values.seo_title = patch.seo_title;
  if (patch.seo_description !== undefined) values.seo_description = patch.seo_description;
  if (patch.mail_from !== undefined) values.mail_from = patch.mail_from;
  if (patch.notify_emails !== undefined) values.notify_emails = patch.notify_emails;
  await getRepo().setSettings(values, updatedBy);
  revalidateTag(SETTINGS_TAG, { expire: 0 });
}
