import Image from "next/image";
import Link from "next/link";
import { CookieConsent } from "@/components/Analytics";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";

export default function LpLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="360 Consultancy — home"><Image src="/brand/logo-header.png" alt="360 Consultancy" width={720} height={373} priority className="h-12 w-auto" /></Link>
          <a href="#start" className="rounded-xl bg-gold-500 px-4 py-2 text-sm font-bold text-navy-950 hover:bg-gold-400">Start free assessment</a>
        </div>
      </header>
      <main id="main">{children}</main>
      <footer className="border-t border-line bg-navy-950 px-4 py-8 text-center text-xs text-white/70">
        <p className="mx-auto max-w-2xl">360 Consultancy is an independent consultancy, not an embassy or government body. We provide guidance only; final visa decisions rest with the relevant authority and no outcome is guaranteed.</p>
        <p className="mt-3 space-x-4"><Link href="/privacy" className="underline">Privacy</Link><Link href="/terms" className="underline">Terms</Link><Link href="/refund-policy" className="underline">Refunds</Link><Link href="/" className="underline">Full website</Link></p>
      </footer>
      <WhatsAppFloat />
      <CookieConsent />
    </>
  );
}
