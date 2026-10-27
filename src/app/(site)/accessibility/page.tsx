import type { Metadata } from "next";
import { Container, PageHero } from "@/components/ui";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Accessibility", description: "Our accessibility commitment and how to report a problem.", alternates: { canonical: "/accessibility" } };

export default function AccessibilityPage() {
  return (
    <>
      <PageHero eyebrow="Accessibility" title="Accessibility statement" />
      <Container className="prose-legal max-w-3xl py-16">
        <p>We want everyone to be able to use this website. We aim to follow the Web Content Accessibility Guidelines (WCAG) 2.2 level AA, including keyboard navigation, visible focus, readable contrast, labelled forms and support for reduced-motion settings.</p>
        <h2>Current status</h2>
        <p>We have not yet completed a formal third-party accessibility audit, so we do not claim full conformance. We are improving the site continuously.</p>
        <h2>Tell us about a problem</h2>
        <p>If you find something hard to use, please contact us{site.contact.email ? <> at <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a></> : null}{site.contact.phone ? <> or on {site.contact.phone}</> : null}. Tell us the page and what happened and we will help you complete what you need and fix the issue.</p>
      </Container>
    </>
  );
}
