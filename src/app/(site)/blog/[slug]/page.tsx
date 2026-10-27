import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogBody } from "@/components/BlogBody";
import { FinalCta } from "@/components/sections";
import { Container, PageHero } from "@/components/ui";
import { getPublishedPost } from "@/lib/cms";
import { siteUrl } from "@/lib/env";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = await getPublishedPost((await params).slug);
  if (!post) return {};
  return { title: post.meta_title || post.title, description: post.meta_description || post.excerpt, alternates: { canonical: `/blog/${post.slug}` }, openGraph: { type: "article", title: post.meta_title || post.title, description: post.meta_description || post.excerpt } };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const post = await getPublishedPost((await params).slug);
  if (!post) notFound();
  const ld = { "@context": "https://schema.org", "@type": "Article", headline: post.title, datePublished: post.published_at, dateModified: post.updated_at, mainEntityOfPage: `${siteUrl()}/blog/${post.slug}`, publisher: { "@type": "Organization", name: "360 Consultancy" } };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <PageHero eyebrow="Blog" title={post.title} intro={post.excerpt} />
      <Container className="max-w-3xl py-16">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted"><Link href="/" className="hover:underline">Home</Link> / <Link href="/blog" className="hover:underline">Blog</Link> / <span className="text-navy-800">{post.title}</span></nav>
        <BlogBody text={post.body} />
        <p className="mt-10 border-t border-line pt-4 text-xs text-muted">General information only, not legal or immigration advice. Visa decisions are made by the relevant authority. Check official sources for current rules.</p>
      </Container>
      <FinalCta />
    </>
  );
}
