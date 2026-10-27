"use client";

import { CalendarDays, ChevronDown, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { buttonClass, cx } from "./ui";

const SERVICE_MENU = [
  { href: "/wizard?purpose=study", label: "Study Visa" },
  { href: "/wizard?purpose=work", label: "Work Visa" },
  { href: "/wizard?purpose=visit", label: "Visit Visa" },
  { href: "/services#document-review", label: "Document Review" },
  { href: "/scholarships", label: "Scholarships" },
];
const COUNTRY_MENU = [
  ["united-states", "United States"], ["united-kingdom", "United Kingdom"], ["canada", "Canada"], ["australia", "Australia"], ["serbia", "Serbia"], ["mexico", "Mexico"], ["china", "China"],
].map(([slug, label]) => ({ href: `/countries/${slug}`, label }));

const NAV = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Visa Services" },
  { href: "/study-abroad", label: "Study Abroad" },
  { href: "/countries", label: "Countries" },
  { href: "/scholarships", label: "Scholarships" },
  { href: "/tools", label: "Tools" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

export function Header({ portal = false }: { portal?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto flex h-[72px] w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="360 Consultancy — home" className="shrink-0">
          <Image src="/brand/logo-header.png" alt="360 Consultancy" width={720} height={373} priority className="h-[58px] w-auto xl:h-[62px]" />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 xl:flex">
          {[
            { href: "/", label: "Home" },
            { href: "/services", label: "Services", menu: SERVICE_MENU },
            { href: "/countries", label: "Countries", menu: COUNTRY_MENU },
            { href: "/scholarships", label: "Scholarships" },
            { href: "/tools", label: "Tools" },
            { href: "/about", label: "About Us" },
            { href: "/contact", label: "Contact" },
          ].map((n) => (
            <div key={n.href} className="group relative">
              <Link
                href={n.href}
                aria-current={isActive(n.href) ? "page" : undefined}
                className={cx(
                  "relative inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors hover:text-navy-700",
                  isActive(n.href) ? "text-navy-900 after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded after:bg-gold-500" : "text-muted",
                )}
              >
                {n.label}
                {n.menu && <ChevronDown className="size-3.5" aria-hidden />}
              </Link>
              {n.menu && (
                <div className="invisible absolute left-0 top-full z-50 w-56 translate-y-1 rounded-xl border border-line bg-white p-2 opacity-0 shadow-lift transition group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  {n.menu.map((m) => (
                    <Link key={m.href} href={m.href} className="block rounded-lg px-3 py-2 text-sm font-semibold text-navy-800 hover:bg-mist">{m.label}</Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {portal && <Link href="/portal" className="hidden px-2 text-sm font-semibold text-navy-800 hover:text-navy-600 xl:inline">Client portal</Link>}
          <Link href="/book" className={buttonClass("primary", "max-sm:hidden px-4")}>
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

      <div id="mobile-menu" hidden={!open} className="border-t border-line bg-white xl:hidden">
        <nav aria-label="Mobile" className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 sm:px-6">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={isActive(n.href) ? "page" : undefined}
              className={cx("rounded-xl px-4 py-3 text-base font-semibold", isActive(n.href) ? "bg-mist text-navy-900" : "text-muted hover:bg-mist")}
            >
              {n.label}
            </Link>
          ))}
          {portal && <Link href="/portal" className="rounded-xl px-4 py-3 text-base font-semibold text-muted hover:bg-mist">Client portal</Link>}
          <Link href="/book" className={buttonClass("primary", "mt-2 w-full")}>
            Book Consultation
          </Link>
        </nav>
      </div>
    </header>
  );
}
