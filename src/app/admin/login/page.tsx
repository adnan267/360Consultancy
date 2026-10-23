import { redirect } from "next/navigation";
import { LoginForm } from "@/components/AdminClient";
import { Card } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/repo";
import { Notice } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminLogin() {
  if (await getSession()) redirect("/admin");
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12">
      <p className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-gold-700">360 Consultancy</p>
      <h1 className="mb-6 text-center text-2xl font-extrabold text-navy-900">Admin sign in</h1>
      <Card className="p-6">
        {!isDatabaseConfigured() && <div className="mb-4"><Notice tone="warn">The database is not configured, so sign-in is unavailable.</Notice></div>}
        <LoginForm />
      </Card>
    </main>
  );
}
