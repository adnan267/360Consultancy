import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Refund and Cancellation Policy", alternates: { canonical: "/refund-policy" } };

export default function Refund() {
  return (
    <LegalPage title="Refund and Cancellation Policy" updated="Draft — terms pending approval by the business owner">
      <h2>1. Before payment</h2>
      <p>You can cancel a booking request at any time before paying, at no cost.</p>
      <h2>2. After payment</h2>
      <p>[Cancellation window, refundable portion and any non-refundable amounts to be set by the business owner and confirmed with legal counsel before bookings open.]</p>
      <h2>3. Visa outcomes</h2>
      <p>Our fee is for our consultancy service, not for a visa outcome. A refusal or delay by an authority is not by itself a ground for refund.</p>
      <h2>4. Government and embassy fees</h2>
      <p>These are paid to the authority and are governed by that authority&apos;s own refund rules. We cannot refund them.</p>
      <h2>5. How refunds are made</h2>
      <p>Approved refunds are made by bank transfer to the account that paid, and are recorded in our audit history. [Timeframe to be confirmed.]</p>
      <h2>6. How to request</h2>
      <p>Contact us with your booking reference as early as possible.</p>
    </LegalPage>
  );
}
