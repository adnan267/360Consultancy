import Link from "next/link";
import { VerifyRunner } from "@/components/PortalClient";
import { Card, Container } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verify email", robots: { index: false, follow: false } };

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <Container className="max-w-md py-16">
      <h1 className="mb-6 text-center text-2xl font-extrabold text-navy-900">Email verification</h1>
      <Card>{token ? <VerifyRunner token={token} /> : <p className="text-sm text-muted">This link is not valid. <Link href="/portal" className="font-semibold underline">Go to your portal</Link>.</p>}</Card>
    </Container>
  );
}
