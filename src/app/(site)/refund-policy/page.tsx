import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Refund and Cancellation Policy", alternates: { canonical: "/refund-policy" } };

export default function Refund() {
  return (
    <LegalPage title="Refund and Cancellation Policy" updated="Draft — some terms still pending approval by the business owner">
      <h2>1. Before payment</h2>
      <p>You can cancel at any time before paying, at no cost.</p>
      <h2>2. If we do not deliver the service</h2>
      <p>If we do not provide the service you paid for, you can request a refund of the fee you paid for that service. This applies to every service we offer, including MBBS and other study-abroad guidance. Examples of &ldquo;not delivered&rdquo; are: we are unable to carry out the review or preparation you paid for, we cancel the service, or we do not hand over the deliverables described in your proposal.</p>
      <p>Each payment stage (starting fee, document review, submission) is treated separately. A stage that we have delivered is not refunded under this section.</p>
      <h2>3. If you cancel after work has started</h2>
      <p>[Refundable portion and any non-refundable amount for work already carried out — to be set by the business owner and confirmed with legal counsel.]</p>
      <h2>4. Outcomes decided by others</h2>
      <p>Our fee is for our consultancy service, not for a visa, university admission or scholarship outcome. A refusal, delay or rejection by an embassy, university or other authority is not by itself a ground for refund, because those decisions are made by them, not by us.</p>
      <h2>5. Government, embassy and university fees</h2>
      <p>These are paid to the authority or institution and are governed by their own refund rules. We cannot refund them. Please do not pay any university or third party until you are comfortable with their terms.</p>
      <h2>6. How refunds are made</h2>
      <p>Approved refunds are returned in the same way you paid. For crypto payments, we send the refund to a wallet address you give us, in the same currency where possible; network fees and the exchange rate at the time may affect the amount received. Every refund is recorded in our audit history. [Processing time to be confirmed.]</p>
      <h2>7. How to request a refund</h2>
      <p>Contact us with your case reference and a short note of what was not delivered. We will reply with our decision in writing.</p>
    </LegalPage>
  );
}
