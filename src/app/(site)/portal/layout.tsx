import type { Metadata } from "next";
import { Container, Notice } from "@/components/ui";
import { portalEnabled } from "@/lib/env";

export const metadata: Metadata = { title: "Client portal", robots: { index: false, follow: false } };

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  if (!portalEnabled()) {
    return (
      <Container className="py-20">
        <Notice tone="info" title="The client portal is not open yet">Accounts, secure document upload and case tracking will open once our services launch. In the meantime you can use the visa options wizard and the free tools.</Notice>
      </Container>
    );
  }
  return <>{children}</>;
}
