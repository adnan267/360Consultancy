import Link from "next/link";
import { ForgotForm } from "@/components/PortalClient";
import { Card, Container } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Forgot password", robots: { index: false, follow: false } };

export default function ForgotPage() {
  return (
    <Container className="max-w-md py-16">
      <h1 className="mb-2 text-center text-2xl font-extrabold text-navy-900">Reset your password</h1>
      <p className="mb-6 text-center text-sm text-muted">Enter your account email and we will send you a link.</p>
      <Card><ForgotForm /></Card>
      <p className="mt-4 text-center text-sm"><Link href="/portal/login" className="font-semibold text-navy-700 underline underline-offset-4">Back to sign in</Link></p>
    </Container>
  );
}
