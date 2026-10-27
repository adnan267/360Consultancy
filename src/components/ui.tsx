import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Reveal } from "./Reveal";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export function Container({ className, ...p }: ComponentProps<"div">) {
  return <div className={cx("mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8", className)} {...p} />;
}

type Variant = "primary" | "secondary" | "ghost" | "dark" | "outline-light";
const base =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition duration-200 focus-visible:outline-offset-4 disabled:pointer-events-none disabled:opacity-50 min-h-11";
const variants: Record<Variant, string> = {
  primary: "bg-gold-500 text-navy-950 shadow-sm hover:bg-gold-400 hover:shadow-md active:translate-y-px",
  secondary: "border border-navy-200 bg-white text-navy-900 hover:border-navy-700 hover:bg-mist",
  ghost: "text-navy-800 hover:bg-mist",
  dark: "bg-navy-900 text-white hover:bg-navy-800",
  "outline-light": "border border-white/40 text-white hover:bg-white/10",
};

export function buttonClass(variant: Variant = "primary", className?: string) {
  return cx(base, variants[variant], className);
}

export function ButtonLink({ variant = "primary", className, href, ...p }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link href={href} className={buttonClass(variant, className)} {...p} />;
}

export function Button({ variant = "primary", className, ...p }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={buttonClass(variant, className)} {...p} />;
}

export function Eyebrow({ children, light }: { children: ReactNode; light?: boolean }) {
  return (
    <p className={cx("mb-3 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em]", light ? "text-gold-300" : "text-gold-700")}>
      <span aria-hidden className={cx("h-px w-8", light ? "bg-gold-300/70" : "bg-gold-500")} />
      {children}
    </p>
  );
}

export function SectionHeading({ eyebrow, title, intro, align = "left", light }: { eyebrow?: string; title: string; intro?: string; align?: "left" | "center"; light?: boolean }) {
  return (
    <div className={cx("max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow && (
        <div className={cx(align === "center" && "flex justify-center")}>
          <Eyebrow light={light}>{eyebrow}</Eyebrow>
        </div>
      )}
      <h2 className={cx("text-3xl font-extrabold tracking-tight text-balance sm:text-4xl", light ? "text-white" : "text-navy-900")}>{title}</h2>
      {intro && <p className={cx("mt-4 text-base leading-relaxed text-pretty sm:text-lg", light ? "text-navy-100" : "text-muted")}>{intro}</p>}
    </div>
  );
}

export function Section({ className, tone = "white", children, id }: { className?: string; tone?: "white" | "mist" | "navy"; children: ReactNode; id?: string }) {
  return (
    <section id={id} className={cx("py-16 sm:py-24", tone === "mist" && "bg-mist", tone === "navy" && "bg-navy-900 text-white", className)}>
      <Container><Reveal>{children}</Reveal></Container>
    </section>
  );
}

export function Card({ className, ...p }: ComponentProps<"div">) {
  return <div className={cx("rounded-2xl border border-line bg-white p-6 shadow-card", className)} {...p} />;
}

export function Badge({ children, tone = "gold" }: { children: ReactNode; tone?: "gold" | "navy" | "green" | "red" | "gray" | "amber" }) {
  const tones = {
    gold: "bg-gold-300/30 text-gold-700 ring-gold-500/30",
    navy: "bg-navy-100 text-navy-800 ring-navy-200",
    green: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    red: "bg-red-50 text-red-800 ring-red-200",
    amber: "bg-amber-50 text-amber-900 ring-amber-200",
    gray: "bg-slate-100 text-slate-700 ring-slate-200",
  };
  return <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset", tones[tone])}>{children}</span>;
}

export function Notice({ tone = "info", title, children }: { tone?: "info" | "warn" | "error" | "success"; title?: string; children: ReactNode }) {
  const tones = {
    info: "border-navy-200 bg-mist text-navy-900",
    warn: "border-amber-300 bg-amber-50 text-amber-950",
    error: "border-red-300 bg-red-50 text-red-900",
    success: "border-emerald-300 bg-emerald-50 text-emerald-950",
  };
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cx("rounded-xl border px-4 py-3 text-sm leading-relaxed", tones[tone])}>
      {title && <p className="font-semibold">{title}</p>}
      <div className={cx(title && "mt-1")}>{children}</div>
    </div>
  );
}

export function PageHero({ eyebrow, title, intro, children }: { eyebrow?: string; title: string; intro?: string; children?: ReactNode }) {
  return (
    <div className="relative overflow-hidden bg-navy-900 text-white">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60rem_30rem_at_85%_-10%,rgb(23_59_120/0.9),transparent),radial-gradient(40rem_20rem_at_-10%_110%,rgb(212_162_42/0.18),transparent)]" />
      <Container className="relative py-14 sm:py-20">
        {eyebrow && <Eyebrow light>{eyebrow}</Eyebrow>}
        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">{title}</h1>
        {intro && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-navy-100 text-pretty">{intro}</p>}
        {children && <div className="mt-8">{children}</div>}
      </Container>
    </div>
  );
}

export function Disclaimer({ className, light }: { className?: string; light?: boolean }) {
  return (
    <p className={cx("text-sm leading-relaxed", light ? "text-navy-100" : "text-muted", className)}>
      Every journey is different. We help you understand the process — final visa decisions remain with the relevant authorities.
    </p>
  );
}
