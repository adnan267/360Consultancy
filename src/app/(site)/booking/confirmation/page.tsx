import type { Metadata } from "next";
import { Suspense } from "react";
import { ConfirmationView } from "@/components/ConfirmationView";
import { Container } from "@/components/ui";

export const metadata: Metadata = { title: "Booking request received", robots: { index: false, follow: false } };

export default function ConfirmationPage() {
  return (
    <Container className="py-14">
      <Suspense fallback={<p className="text-center text-muted">Loading…</p>}>
        <ConfirmationView />
      </Suspense>
    </Container>
  );
}
