"use client";

import { Button, Container } from "@/components/ui";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <Container className="py-24 text-center">
      <h1 className="text-3xl font-extrabold text-navy-900">Something went wrong</h1>
      <p className="mx-auto mt-3 max-w-md text-muted">An unexpected error occurred. Please try again; if it keeps happening, contact us.</p>
      <Button onClick={reset} className="mt-6">Try again</Button>
    </Container>
  );
}
