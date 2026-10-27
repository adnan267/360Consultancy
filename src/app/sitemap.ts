import type { MetadataRoute } from "next";
import { COUNTRY_CONTENT } from "@/data/countries";
import { getPublishedPosts } from "@/lib/cms";
import { siteUrl } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedPosts(200);
  const base = siteUrl();
  const pages = ["", "/services", "/countries", "/wizard", "/scholarships", "/tools", "/tools/document-checklist", "/compare", "/how-it-works", "/about", "/contact", "/faq", "/blog", "/pricing", "/study-abroad", "/destinations", "/umrah", "/spiritual-tours", "/accessibility", "/book", "/privacy", "/terms", "/refund-policy"];
  return [
    ...pages.map((p) => ({ url: `${base}${p}`, changeFrequency: "monthly" as const, priority: p === "" ? 1 : 0.7 })),
    ...COUNTRY_CONTENT.map((c) => ({ url: `${base}/countries/${c.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...posts.map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: p.updated_at, changeFrequency: "monthly" as const, priority: 0.5 })),
  ];
}
