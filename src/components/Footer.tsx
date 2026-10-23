import { Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { whatsappLink, site } from "@/lib/site";
import { Container } from "./ui";

const social = [
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "youtube", label: "YouTube" },
] as const;

export function Footer() {
  const c = site.contact;
  const wa = whatsappLink();
  const socials = social.filter((s) => site.social[s.key]);
  const hasContact = c.email || c.phone || c.address || wa;

  return (
    <footer className="bg-navy-950 text-navy-100">
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <div className="inline-block rounded-2xl bg-white p-3 shadow-lg">
              <Image src="/brand/logo-header.png" alt="360 Consultancy" width={720} height={402} className="h-16 w-auto" />
            </div>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-navy-200">{site.description}</p>
            {socials.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-2">
                {socials.map(({ key, label }) => (
                  <li key={key}>
                    <a href={site.social[key]} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center rounded-full border border-white/20 px-4 text-xs font-semibold text-white transition hover:border-gold-400 hover:text-gold-300">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <nav aria-label="Quick links">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">Quick links</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {site.nav.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="text-navy-200 transition hover:text-gold-300">{n.label}</Link>
                </li>
              ))}
              <li><Link href="/faq" className="text-navy-200 transition hover:text-gold-300">FAQs</Link></li>
            </ul>
          </nav>

          <nav aria-label="Policies">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">Policies</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/privacy" className="text-navy-200 transition hover:text-gold-300">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-navy-200 transition hover:text-gold-300">Terms of Service</Link></li>
              <li><Link href="/refund-policy" className="text-navy-200 transition hover:text-gold-300">Refund &amp; Cancellation</Link></li>
            </ul>
          </nav>

          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">Contact</h2>
            {hasContact ? (
              <ul className="mt-4 space-y-3 text-sm">
                {c.phone && <li className="flex gap-3"><Phone className="mt-0.5 size-4 shrink-0 text-gold-400" /><a href={`tel:${c.phone.replace(/\s/g, "")}`} className="hover:text-gold-300">{c.phone}</a></li>}
                {c.email && <li className="flex gap-3"><Mail className="mt-0.5 size-4 shrink-0 text-gold-400" /><a href={`mailto:${c.email}`} className="break-all hover:text-gold-300">{c.email}</a></li>}
                {c.address && <li className="flex gap-3"><MapPin className="mt-0.5 size-4 shrink-0 text-gold-400" /><span>{c.address}</span></li>}
                {wa && <li><a href={wa} target="_blank" rel="noopener noreferrer" className="font-semibold text-gold-300 hover:underline">Chat on WhatsApp</a></li>}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-navy-200">Contact details will appear here once published.</p>
            )}
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-xs leading-relaxed text-navy-200">
          <p className="max-w-3xl">{site.disclaimer}</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} {site.name}. All rights reserved.{site.registration && <> Registration: {site.registration}.</>}</p>
            <p>{site.domain}</p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
