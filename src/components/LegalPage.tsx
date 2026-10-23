import { Container, Notice, PageHero } from "./ui";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <>
      <PageHero title={title} />
      <Container className="max-w-3xl py-14">
        <Notice tone="warn" title={updated}>This page is a working draft and must be reviewed by a qualified legal professional before bookings open. Bracketed items are placeholders.</Notice>
        <div className="prose-legal mt-8">{children}</div>
      </Container>
    </>
  );
}
