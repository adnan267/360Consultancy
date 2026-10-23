import type { MetadataRoute } from "next";
import { COUNTRY_CONTENT } from "@/data/countries";
import { siteUrl } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const pages = ["", "/services", "/countries", "/wizard", "/scholarships", "/tools", "/tools/document-checklist", "/compare", "/how-it-works", "/about", "/contact", "/faq", "/book", "/privacy", "/terms", "/refund-policy"];
  return [
    ...pages.map((p) => ({ url: `${base}${p}`, changeFrequency: "monthly" as const, priority: p === "" ? 1 : 0.7 })),
    ...COUNTRY_CONTENT.map((c) => ({ url: `${base}/countries/${c.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
