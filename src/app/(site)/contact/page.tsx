import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { Metadata } from "next";
import { ButtonLink, Card, Container, Notice, PageHero } from "@/components/ui";
import { site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = { title: "Contact Us", description: "Get in touch with 360 Consultancy.", alternates: { canonical: "/contact" } };

export default function ContactPage() {
  const c = site.contact;
  const wa = whatsappLink();
  const items = [
    wa && { Icon: MessageCircle, label: "WhatsApp", value: "Chat with us", href: wa },
    c.phone && { Icon: Phone, label: "Phone", value: c.phone, href: `tel:${c.phone.replace(/\s/g, "")}` },
    c.email && { Icon: Mail, label: "Email", value: c.email, href: `mailto:${c.email}` },
    c.address && { Icon: MapPin, label: "Address", value: c.address, href: undefined },
  ].filter(Boolean) as { Icon: typeof Mail; label: string; value: string; href?: string }[];

  return (
    <>
      <PageHero eyebrow="Contact" title="We're happy to point you in the right direction" intro="Send us a short message about your goal, or request a consultation." />
      <Container className="py-16">
        {items.length ? (
          <ul className="grid gap-5 sm:grid-cols-2">
            {items.map(({ Icon, label, value, href }) => (
              <li key={label}><Card className="flex items-start gap-4"><span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-navy-900 text-gold-300"><Icon className="size-5" /></span><div><p className="text-sm font-semibold text-muted">{label}</p>{href ? <a href={href} className="break-all text-lg font-bold text-navy-900 hover:underline" {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{value}</a> : <p className="text-lg font-bold text-navy-900">{value}</p>}</div></Card></li>
            ))}
          </ul>
        ) : (
          <Notice tone="info" title="Contact details coming soon">Our verified contact details will be published here shortly. In the meantime you can use the booking page.</Notice>
        )}
        <div className="mt-10"><ButtonLink href="/book">Book a Consultation</ButtonLink></div>
      </Container>
    </>
  );
}
