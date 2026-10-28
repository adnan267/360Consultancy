/**
 * Public brand + contact configuration.
 * NEXT_PUBLIC_* values are inlined at build time. Blank = not yet verified,
 * and the UI hides the item rather than showing an invented one.
 */
const clean = (v: string | undefined) => (v && v.trim() ? v.trim() : "");

export const site = {
  name: "360 Consultancy",
  domain: "360consultancy.pk",
  tagline: "Your Visa · Our Guidance · A Brighter Future",
  description:
    "Clear, practical visa guidance from 360 Consultancy: understand your options, organise your documents and prepare for your next step.",
  contact: {
    email: clean(process.env.NEXT_PUBLIC_CONTACT_EMAIL),
    // Owner's choice: no phone number or WhatsApp on the website (contact is by email and the forms).
    phone: "" as string,
    whatsapp: "" as string,
    address: clean(process.env.NEXT_PUBLIC_BUSINESS_ADDRESS),
  },
  social: {
    facebook: clean(process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK),
    instagram: clean(process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM),
    linkedin: clean(process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN),
    youtube: clean(process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE),
  },
  registration: clean(process.env.NEXT_PUBLIC_BUSINESS_REGISTRATION),
  disclaimer:
    "Every journey is different. We help you understand the process — final visa decisions remain with the relevant authorities. 360 Consultancy does not guarantee any visa, job, work permit or immigration outcome.",
  nav: [
    { href: "/", label: "Home" },
    { href: "/services", label: "Visa Services" },
    { href: "/countries", label: "Countries" },
    { href: "/how-it-works", label: "How It Works" },
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
  ],
} as const;

export function whatsappLink(text = "Hello 360 Consultancy, I would like some guidance."): string | null {
  if (!site.contact.whatsapp) return null;
  return `https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(text)}`;
}
