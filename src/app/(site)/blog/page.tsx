import type { Metadata } from "next";
import Link from "next/link";
import { FinalCta } from "@/components/sections";
import { Card, Container, PageHero } from "@/components/ui";
import { getPublishedPosts } from "@/lib/cms";

export const revalidate = 300;
export const metadata: Metadata = { title: "Blog", description: "Practical guides on studying, travelling and applying abroad from 360 Consultancy.", alternates: { canonical: "/blog" } };

export default async function BlogPage() {
  const posts = await getPublishedPosts();
  return (
    <>
      <PageHero eyebrow="Blog" title="Guides and updates" intro="Practical, source-linked information. Always check official sources for the latest rules." />
      <Container className="py-16">
        {posts.length === 0 ? <p className="text-muted">Articles are coming soon.</p> : (
          <ul className="grid gap-6 md:grid-cols-2">{posts.map((p) => (
            <li key={p.id}><Card className="h-full"><h2 className="text-xl font-bold text-navy-900"><Link href={`/blog/${p.slug}`} className="hover:underline">{p.title}</Link></h2>{p.published_at && <p className="mt-1 text-xs text-muted">{new Date(p.published_at).toLocaleDateString("en-GB", { dateStyle: "long", timeZone: "Asia/Karachi" })}</p>}<p className="mt-3 text-muted">{p.excerpt}</p><Link href={`/blog/${p.slug}`} className="mt-4 inline-block text-sm font-semibold text-navy-700 underline underline-offset-4">Read more</Link></Card></li>
          ))}</ul>
        )}
      </Container>
      <FinalCta />
    </>
  );
}
