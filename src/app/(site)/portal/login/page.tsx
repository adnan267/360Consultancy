import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/PortalClient";
import { Card, Container } from "@/components/ui";
import { getClientSession } from "@/lib/client-auth";

export const dynamic = "force-dynamic";

export default async function PortalLogin() {
  if (await getClientSession()) redirect("/portal");
  return (
    <Container className="max-w-md py-16">
      <h1 className="mb-6 text-center text-2xl font-extrabold text-navy-900">Sign in to your portal</h1>
      <Card><AuthForm mode="login" /></Card>
      <p className="mt-4 text-center text-sm text-muted">New here? <Link href="/portal/register" className="font-semibold text-navy-700 underline underline-offset-4">Create an account</Link></p>
      <p className="mt-2 text-center text-xs text-muted">Forgot your password? Contact us and we will help you reset it.</p>
    </Container>
  );
}
