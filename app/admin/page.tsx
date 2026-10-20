import AdminClient from "./ui";
import { isAdmin } from "@/lib/session";
import Link from "next/link";

export const dynamic = "force-dynamic";
export default async function AdminPage() {
  const authenticated = await isAdmin();
  return <main className="container admin-wrap"><div className="nav"><Link className="brand" href="/">360<span>Consultancy</span></Link><Link href="/" className="pill dark">View website</Link></div><AdminClient authenticated={authenticated}/></main>;
}