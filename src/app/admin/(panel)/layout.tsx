import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLink } from "@/components/admin";
import { LogoutButton } from "@/components/AdminClient";
import { Container } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  // Server-side gate on every admin page render. API routes re-check independently.
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return (
    <>
      <header className="bg-navy-900">
        <Container className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="rounded-lg bg-white p-1"><Image src="/brand/icon-32.png" alt="360 Consultancy admin" width={32} height={32} /></Link>
            <nav aria-label="Admin" className="flex flex-wrap items-center">
              <AdminLink href="/admin">Dashboard</AdminLink>
              <AdminLink href="/admin/bookings">Bookings</AdminLink>
              {can(session.role, "case:view") && <AdminLink href="/admin/cases">Cases</AdminLink>}
              {can(session.role, "lead:view") && <AdminLink href="/admin/leads">Leads</AdminLink>}
              {can(session.role, "payment:verify") && <AdminLink href="/admin/reports">Reports</AdminLink>}
              {can(session.role, "service:manage") && <AdminLink href="/admin/services">Services &amp; pricing</AdminLink>}
              {can(session.role, "export:csv") && <a href="/api/admin/export" className="rounded-lg px-3 py-2 text-sm font-semibold text-navy-100 hover:bg-white/10 hover:text-white">Export CSV</a>}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-navy-200"><span>{session.email} · {session.role}</span><LogoutButton /></div>
        </Container>
      </header>
      <main id="main"><Container className="py-8">{children}</Container></main>
    </>
  );
}
