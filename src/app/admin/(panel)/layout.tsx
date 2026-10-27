import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNavLink, LogoutButton } from "@/components/AdminClient";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  // Server-side gate on every admin page render. API routes re-check independently.
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return (
    <div className="md:flex md:min-h-dvh">
      <aside className="bg-navy-900 md:sticky md:top-0 md:flex md:h-dvh md:w-64 md:shrink-0 md:flex-col md:overflow-y-auto">
        <div className="flex items-center gap-3 px-4 py-3 md:py-5">
          <Link href="/admin" className="rounded-lg bg-white p-1"><Image src="/brand/icon-32.png" alt="360 Consultancy admin" width={32} height={32} /></Link>
          <span className="text-sm font-bold text-white">360 Admin</span>
        </div>
        <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:overflow-visible md:pb-0">
          <AdminNavLink href="/admin" exact>Dashboard</AdminNavLink>
          <AdminNavLink href="/admin/bookings">Bookings</AdminNavLink>
          {can(session.role, "case:view") && <AdminNavLink href="/admin/cases">Cases</AdminNavLink>}
          {can(session.role, "lead:view") && <AdminNavLink href="/admin/leads">Leads</AdminNavLink>}
          {can(session.role, "payment:verify") && <AdminNavLink href="/admin/reports">Reports</AdminNavLink>}
          {can(session.role, "service:manage") && <AdminNavLink href="/admin/services">Services &amp; pricing</AdminNavLink>}
          {can(session.role, "content:manage") && <AdminNavLink href="/admin/faqs">FAQs</AdminNavLink>}
          {can(session.role, "content:manage") && <AdminNavLink href="/admin/blog">Blog</AdminNavLink>}
          {can(session.role, "team:manage") && <AdminNavLink href="/admin/team">Team</AdminNavLink>}
          {can(session.role, "team:manage") && <AdminNavLink href="/admin/data-requests">Data requests</AdminNavLink>}
          {can(session.role, "settings:manage") && <AdminNavLink href="/admin/settings">Settings</AdminNavLink>}
          {can(session.role, "export:csv") && <a href="/api/admin/export" className="block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-navy-100 hover:bg-white/10 hover:text-white">Export CSV</a>}
        </nav>
        <div className="space-y-1 border-t border-white/10 px-3 py-3 text-sm text-navy-200">
          <p className="break-all px-3 text-xs">{session.email} · {session.role}</p>
          <AdminNavLink href="/admin/password">Password</AdminNavLink>
          <LogoutButton />
        </div>
      </aside>
      <main id="main" className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
