import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Terms of Service", alternates: { canonical: "/terms" } };

export default function Terms() {
  return (
    <LegalPage title="Terms of Service" updated="Draft — not yet reviewed by legal counsel">
      <h2>1. Our service</h2>
      <p>360 Consultancy provides general visa guidance, consultations and document-review assistance. We are not an embassy, consulate or government body and do not make visa decisions.</p>
      <h2>2. No guarantee</h2>
      <p>We do not guarantee any visa, job, work permit or immigration outcome. Final decisions are made solely by the relevant authorities.</p>
      <h2>3. Booking requests</h2>
      <p>Submitting the booking form creates a request only. A booking is confirmed only when we accept it, you pay the agreed fee and we verify the payment against our bank account records.</p>
      <h2>4. Fees and payment</h2>
      <p>Our fee covers our consultancy service only. Government, embassy, biometric and courier fees are separate and are paid directly to the relevant authority. Each step is paid online in your client portal before it begins; work on a step starts only after its payment is confirmed.</p>
      <h2>5. Your responsibilities</h2>
      <p>You must give accurate information and remain responsible for the accuracy and completeness of any application you submit.</p>
      <h2>6. Information on this website</h2>
      <p>Country information is general and may be out of date. Always confirm current rules on the official government website.</p>
      <h2>7. Liability</h2>
      <p>To the extent permitted by law, we are not liable for decisions made by authorities or for losses arising from reliance on general information. [Final wording to be settled with legal counsel.]</p>
      <h2>8. Governing law</h2>
      <p>[To be confirmed with legal counsel.]</p>
    </LegalPage>
  );
}
