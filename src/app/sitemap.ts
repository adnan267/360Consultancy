import type { MetadataRoute } from "next";
import { COUNTRY_CONTENT } from "@/data/countries";
import { getPublishedPosts } from "@/lib/cms";
import { siteUrl } from "@/lib/env";
import { getStudyDestinations, getStudyScholarships, getUniversities } from "@/lib/study";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedPosts(200);
  const base = siteUrl();
  const [dests, unis, schol] = await Promise.all([getStudyDestinations(), getUniversities(), getStudyScholarships()]).catch(() => [[], [], []] as [never[], never[], never[]]);
  const pages = ["", "/services", "/countries", "/wizard", "/scholarships", "/tools", "/tools/document-checklist", "/compare", "/how-it-works", "/about", "/contact", "/faq", "/blog", "/pricing", "/study-abroad", "/study-abroad/destinations", "/study-abroad/universities", "/study-abroad/fully-funded-scholarships", "/study-abroad/tuition-free-universities", "/study-abroad/university-admissions", "/study-abroad/student-visa-assistance", "/study-abroad/application-process", "/study-abroad/consultation", "/destinations", "/religious-tours", ...["umrah","hajj","makkah-madinah-ziyarat","iraq-ziyarat","iran-ziyarat","jerusalem-al-aqsa","other-religious"].map((s) => `/religious-tours/${s}`), "/tour-packages", "/accessibility", "/book", "/privacy", "/terms", "/refund-policy"];
  return [
    ...pages.map((p) => ({ url: `${base}${p}`, changeFrequency: "monthly" as const, priority: p === "" ? 1 : 0.7 })),
    ...COUNTRY_CONTENT.map((c) => ({ url: `${base}/countries/${c.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...dests.map((d) => ({ url: `${base}/study-abroad/destinations/${d.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...unis.map((u) => ({ url: `${base}/study-abroad/universities/${u.slug}`, changeFrequency: "monthly" as const, priority: 0.5 })),
    ...schol.map((x) => ({ url: `${base}/scholarships/${x.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...posts.map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: p.updated_at, changeFrequency: "monthly" as const, priority: 0.5 })),
  ];
}
