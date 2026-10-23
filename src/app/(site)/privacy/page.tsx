import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy Policy", alternates: { canonical: "/privacy" } };

export default function Privacy() {
  const contact = site.contact.email || "the contact details published on this website";
  return (
    <LegalPage title="Privacy Policy" updated="Draft — not yet reviewed by legal counsel">
      <h2>1. Who we are</h2>
      <p>This website is operated by 360 Consultancy (&quot;we&quot;). You can contact us at {contact}.</p>
      <h2>2. What we collect</h2>
      <p>When you submit a booking request we collect your name, email address, phone/WhatsApp number, country of interest, selected service, preferred appointment time and any message you choose to write. We do not ask for passport numbers, identity documents or payment card details through this website. Please do not include such details in your message.</p>
      <h2>3. Why we use it</h2>
      <ul><li>To respond to your request and provide the service you asked for.</li><li>To send booking, payment-instruction and confirmation messages.</li><li>To verify bank-transfer payments and keep accurate business records.</li><li>To protect the website against abuse.</li></ul>
      <h2>4. Who we share it with</h2>
      <p>We use service providers to run the website and store data (for example our hosting provider, database provider and email provider). They process data on our behalf. We do not sell your personal data.</p>
      <h2>4A. Client portal and uploaded documents</h2>
      <p>If you create a portal account we store your name, email, optional phone number and a hashed password. Documents you upload (which may include your passport page, certificates and financial evidence) are stored in private storage, are visible only to you and our authorised staff, and are used only to review your documents and prepare your submission. Staff downloads are logged. Please upload only what the step asks for. [Business owner and counsel to confirm: lawful basis, where files are hosted, who may access them, and the retention and deletion period for documents.]</p>
      <h2>5. How long we keep it</h2>
      <p>We keep booking records for a limited period needed for service delivery, accounting and dispute handling, after which they are deleted. [Retention period to be confirmed by the business owner.]</p>
      <h2>6. Your rights</h2>
      <p>You may ask us to access, correct or delete your personal data, subject to legal requirements. Contact us using the details above.</p>
      <h2>7. Security</h2>
      <p>We use access controls, encryption in transit and limited staff access. No system is perfectly secure.</p>
      <h2>8. Changes</h2>
      <p>We may update this policy and will post the new version on this page.</p>
    </LegalPage>
  );
}
