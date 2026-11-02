"use client";

import { CalendarDays, ChevronDown, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { buttonClass, cx } from "./ui";

type L = { href: string; label: string };
type Group = { title: string; links: L[] };
type Item = { label: string; href: string; groups?: Group[]; align?: "left" | "right" };

const MENU: Item[] = [
  { label: "Home", href: "/" },
  {
    label: "Visa Services", href: "/services",
    groups: [
      { title: "Get started", links: [{ href: "/wizard", label: "Find Visa Options" }, { href: "/book", label: "Book a Consultation" }, { href: "/tools", label: "Free Tools" }] },
      { title: "Visa types", links: [{ href: "/wizard?purpose=work", label: "Work Visa" }, { href: "/wizard?purpose=visit", label: "Visit Visa" }, { href: "/wizard?purpose=business", label: "Business Visa" }] },
      { title: "Our services", links: [{ href: "/services", label: "All Visa Services" }, { href: "/services#document-review", label: "Document Review" }, { href: "/countries", label: "Country Guides" }, { href: "/destinations", label: "E-visa & Visa-free" }] },
    ],
  },
  {
    label: "Study Abroad", href: "/study-abroad",
    groups: [
      { title: "Explore", links: [{ href: "/study-abroad/destinations", label: "Study Destinations" }, { href: "/study-abroad/universities", label: "Find Your University" }, { href: "/study-abroad/tuition-free-universities", label: "Tuition-Free Universities" }] },
      { title: "Scholarships", links: [{ href: "/scholarships", label: "Find Scholarships" }, { href: "/study-abroad/fully-funded-scholarships", label: "Fully Funded Scholarships" }] },
      { title: "Apply", links: [{ href: "/study-abroad/university-admissions", label: "University Admissions" }, { href: "/study-abroad/student-visa-assistance", label: "Student Visa Assistance" }, { href: "/study-abroad/application-process", label: "Application Process" }, { href: "/study-abroad/consultation", label: "Study Abroad Consultation" }] },
    ],
  },
  {
    label: "Tours", href: "/tour-packages",
    groups: [
      { title: "Tour packages", links: [{ href: "/tour-packages", label: "All Tour Packages" }, { href: "/destinations", label: "E-visa & Visa-free" }] },
      { title: "Religious & Spiritual", links: [{ href: "/religious-tours/umrah", label: "Umrah Packages" }, { href: "/religious-tours/hajj", label: "Hajj Packages" }, { href: "/religious-tours/makkah-madinah-ziyarat", label: "Makkah & Madinah Ziyarat" }, { href: "/religious-tours/iraq-ziyarat", label: "Iraq Ziyarat" }, { href: "/religious-tours/iran-ziyarat", label: "Iran Ziyarat" }, { href: "/religious-tours", label: "All Religious Tours" }] },
    ],
  },
  { label: "Pricing", href: "/pricing" },
  {
    label: "About", href: "/about", align: "right",
    groups: [{ title: "Company", links: [{ href: "/about", label: "About Us" }, { href: "/how-it-works", label: "How It Works" }, { href: "/faq", label: "FAQ" }, { href: "/contact", label: "Contact" }] }],
  },
];

export function Header({ portal = false }: { portal?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<string | null>(null);

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const itemActive = (it: Item) => isActive(it.href) || !!it.groups?.some((g) => g.links.some((l) => isActive(l.href.split(/[?#]/)[0]) && l.href.split(/[?#]/)[0] !== "/"));

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto flex h-[72px] w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="360 Consultancy — home" className="shrink-0">
          <Image src="/brand/logo-header.png" alt="360 Consultancy" width={720} height={373} priority className="h-[58px] w-auto xl:h-[62px]" />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 xl:flex">
          {MENU.map((n) => (
            <div key={n.label} className="group relative">
              <Link
                href={n.href}
                aria-current={itemActive(n) ? "page" : undefined}
                className={cx(
                  "relative inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-colors hover:text-navy-700",
                  itemActive(n) ? "text-navy-900 after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded after:bg-gold-500" : "text-muted",
                )}
              >
                {n.label}
                {n.groups && <ChevronDown className="size-3.5" aria-hidden />}
              </Link>
              {n.groups && (
                <div className={cx("invisible absolute top-full z-50 translate-y-1 pt-2 opacity-0 transition group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100", n.align === "right" ? "right-0" : "left-0")}>
                  <div className={cx("grid gap-6 rounded-2xl border border-line bg-white p-5 shadow-lift", n.groups.length >= 3 ? "w-[44rem] grid-cols-3" : n.groups.length === 2 ? "w-[32rem] grid-cols-2" : "w-56 grid-cols-1")}>
                    {n.groups.map((g) => (
                      <div key={g.title}>
                        <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.14em] text-gold-700">{g.title}</p>
                        <ul>{g.links.map((m) => <li key={m.href + m.label}><Link href={m.href} className="block rounded-lg px-2 py-1.5 text-sm font-semibold text-navy-800 hover:bg-mist">{m.label}</Link></li>)}</ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {portal && <Link href="/portal" className="hidden whitespace-nowrap px-2 text-sm font-semibold text-navy-800 hover:text-navy-600 xl:inline">Client portal</Link>}
          <Link href="/book" className={buttonClass("primary", "max-sm:hidden whitespace-nowrap px-4")}>
            <CalendarDays className="size-4" aria-hidden /> Book Consultation
          </Link>
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-xl border border-line text-navy-900 xl:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <div id="mobile-menu" hidden={!open} className="max-h-[calc(100dvh-72px)] overflow-y-auto border-t border-line bg-white xl:hidden">
        <nav aria-label="Mobile" className="mx-auto flex max-w-2xl flex-col gap-1 px-4 py-4 sm:px-6">
          {MENU.map((n) => {
            if (!n.groups) {
              return <Link key={n.label} href={n.href} aria-current={isActive(n.href) ? "page" : undefined} className={cx("rounded-xl px-4 py-3 text-base font-bold", isActive(n.href) ? "bg-mist text-navy-900" : "text-navy-900 hover:bg-mist")}>{n.label}</Link>;
            }
            const expanded = section === n.label;
            return (
              <div key={n.label} className="rounded-xl">
                <button type="button" aria-expanded={expanded} aria-controls={`m-${n.label}`} onClick={() => setSection(expanded ? null : n.label)} className={cx("flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-base font-bold", expanded ? "bg-mist text-navy-900" : "text-navy-900 hover:bg-mist")}>
                  {n.label}<ChevronDown className={cx("size-5 transition-transform", expanded && "rotate-180")} aria-hidden />
                </button>
                <div id={`m-${n.label}`} hidden={!expanded} className="space-y-3 px-2 pb-3 pt-2">
                  {n.groups.map((g) => (
                    <div key={g.title}>
                      <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-gold-700">{g.title}</p>
                      <ul>{g.links.map((m) => <li key={m.href + m.label}><Link href={m.href} className="block rounded-lg px-3 py-2.5 text-[15px] font-semibold text-muted hover:bg-mist hover:text-navy-900">{m.label}</Link></li>)}</ul>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {portal && <Link href="/portal" className="rounded-xl px-4 py-3 text-base font-bold text-navy-900 hover:bg-mist">Client portal</Link>}
          <Link href="/book" className={buttonClass("primary", "mt-2 w-full")}>Book Consultation</Link>
        </nav>
      </div>
    </header>
  );
}
