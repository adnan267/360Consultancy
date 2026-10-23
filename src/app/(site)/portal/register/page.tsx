import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/PortalClient";
import { Card, Container, Notice } from "@/components/ui";
import { getClientSession } from "@/lib/client-auth";

export const dynamic = "force-dynamic";

export default async function PortalRegister() {
  if (await getClientSession()) redirect("/portal");
  return (
    <Container className="max-w-md py-16">
      <h1 className="mb-2 text-center text-2xl font-extrabold text-navy-900">Create your account</h1>
      <p className="mb-6 text-center text-sm text-muted">Track your case and upload documents securely.</p>
      <div className="mb-4"><Notice tone="info">Creating an account is free. Fees apply only at the steps shown in your case, and are always shown before you pay.</Notice></div>
      <Card><AuthForm mode="register" /></Card>
      <p className="mt-4 text-center text-sm text-muted">Already registered? <Link href="/portal/login" className="font-semibold text-navy-700 underline underline-offset-4">Sign in</Link></p>
    </Container>
  );
}
