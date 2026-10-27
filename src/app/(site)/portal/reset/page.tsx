import Link from "next/link";
import { ResetForm } from "@/components/PortalClient";
import { Card, Container } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Choose a new password", robots: { index: false, follow: false } };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <Container className="max-w-md py-16">
      <h1 className="mb-6 text-center text-2xl font-extrabold text-navy-900">Choose a new password</h1>
      <Card>{token ? <ResetForm token={token} /> : <p className="text-sm text-muted">This reset link is not valid. <Link href="/portal/forgot" className="font-semibold underline">Request a new one</Link>.</p>}</Card>
    </Container>
  );
}
