import { ArrowRight, Briefcase, Check, Clock, ExternalLink, FileCheck2, GraduationCap, HeartHandshake, Lock, MessageCircle, Plane, ScrollText, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { FAQS, PROCESS_STEPS } from "@/data/faq";
import { COUNTRY_CONTENT } from "@/data/countries";
import { CalendarDays, Compass, MoonStar } from "lucide-react";
import { servicesEnabled } from "@/lib/env";
import { Flag } from "./Flag";
import { formatPkr } from "@/lib/pricing";
import { getPublicFaqs } from "@/lib/cms";
import { site, whatsappLink } from "@/lib/site";
import { FUNDING_LABEL, type Country, type Scholarship, type Service } from "@/lib/types";
import { Badge, ButtonLink, Card, Container, Notice, Section, SectionHeading, cx } from "./ui";

export function FeeLabel({ service }: { service: Service }) {
  return (
    <span>
      {service.fee_is_starting_price && <span className="text-sm font-semibold text-muted">from </span>}
      <span className="text-2xl font-extrabold text-navy-900">{formatPkr(service.fee_pkr)}</span>
    </span>
  );
}

export function TrustSection() {
  const items = [
    { Icon: HeartHandshake, t: "Honest guidance", d: "We explain the process and your options. We never promise a visa, a job or an immigration outcome." },
    { Icon: ScrollText, t: "Official sources first", d: "We point you to the official government sources and show when information was last checked." },
    { Icon: ShieldCheck, t: "Transparent fees", d: "Our fee is shown up front. Government and embassy fees are separate and paid to the authority." },
    { Icon: Lock, t: "Privacy-minded", d: "The booking form never asks for passport numbers or ID uploads. We collect only what we need." },
  ];
  return (
    <Section className="!py-14 sm:!py-16">
      <SectionHeading eyebrow="Why choose us" title="Your trusted visa guidance partner" />
      <ul className="mt-10 grid overflow-hidden rounded-2xl border border-line bg-white shadow-card sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-line">
        {items.map(({ Icon, t, d }) => (
          <li key={t} className="flex gap-4 border-b border-line p-6 last:border-b-0 lg:border-b-0">
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-gold-300/30 text-gold-700 ring-1 ring-gold-500/30"><Icon className="size-6" /></span>
            <div>
              <h3 className="font-bold text-navy-900">{t}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{d}</p>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

const PURPOSES = [
  { Icon: Briefcase, t: "Work Visa", d: "Understand work-visa routes and prepare your qualifications and experience evidence.", href: "/wizard?purpose=work" },
  { Icon: Plane, t: "Visit Visa", d: "Guidance for tourism, family visits or business trips, with official portals first.", href: "/wizard?purpose=visit" },
  { Icon: GraduationCap, t: "Study Visa", d: "Plan admission-to-visa steps and explore verified scholarship records.", href: "/wizard?purpose=study" },
  { Icon: FileCheck2, t: "Document Review", d: "A check of your documents against the official checklist, with suggestions.", href: "/services#document-review" },
];

export function PurposeCards() {
  return (
    <Section className="!pb-10 sm:!pb-14 !pt-14 sm:!pt-20">
      <SectionHeading align="center" eyebrow="Our services" title="Visa services we provide" intro="From visiting family to building a career abroad — practical guidance, clearly scoped, with no promised outcomes." />
      <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PURPOSES.map(({ Icon, t, d, href }) => (
          <li key={t}>
            <Link href={href} className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-white to-mist p-6 shadow-card transition hover:-translate-y-1 hover:shadow-lift hover:ring-1 hover:ring-gold-500">
              <span className="inline-flex size-14 items-center justify-center rounded-full bg-navy-900 text-gold-300 shadow-md"><Icon className="size-6" /></span>
              <h3 className="mt-5 text-lg font-extrabold text-navy-900">{t}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{d}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-navy-700">Learn more <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function ServicesSection({ services }: { services: Service[] }) {
  return (
    <Section>
      <SectionHeading eyebrow="Our services" title="Visa consultancy services" intro="Practical, clearly scoped help — so you know what you are getting before you book." />
      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <Card key={s.id} className="group flex flex-col transition duration-200 hover:-translate-y-1 hover:shadow-lift">
            <h3 className="text-xl font-bold text-navy-900">{s.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{s.summary}</p>
            {s.duration_minutes && (
              <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-navy-800">
                <Clock className="size-4 text-gold-600" /> {s.duration_minutes} minutes
              </p>
            )}
            <Link href={`/services#${s.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-navy-700 hover:text-navy-900">
              Learn more <ArrowRight className="size-4 transition group-hover:translate-x-1" />
            </Link>
          </Card>
        ))}
      </div>
    </Section>
  );
}

const flagOf = (slug: string) => COUNTRY_CONTENT.find((c) => c.slug === slug)?.flag;

export function FeaturedCountries({ countries }: { countries: Country[] }) {
  return (
    <Section tone="mist" className="!py-12 sm:!py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading eyebrow="Popular destinations" title="Explore top destinations" intro="General guidance and official links for each destination. More are added only after we verify their official sources." />
        <Link href="/countries" className="inline-flex items-center gap-2 text-sm font-bold text-navy-700 hover:text-navy-900">View all countries <ArrowRight className="size-4" /></Link>
      </div>
      <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {countries.map((c) => (
          <li key={c.id}>
            <Link href={`/countries/${c.slug}`} className="group flex h-full flex-col items-center gap-3 rounded-xl bg-white px-3 py-5 text-center shadow-card ring-1 ring-line transition hover:-translate-y-1 hover:shadow-lift hover:ring-gold-500">
              <Flag code={flagOf(c.slug) ?? ""} label={c.name} className="text-5xl" />
              <span className="text-sm font-bold text-navy-900">{c.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function PurposeBlock({ id, eyebrow, title, intro, points, href, cta, children, tone }: { id: string; eyebrow: string; title: string; intro: string; points: string[]; href: string; cta: string; children?: React.ReactNode; tone?: "mist" | "white" }) {
  return (
    <Section id={id} tone={tone ?? "white"}>
      <div className="grid items-start gap-10 lg:grid-cols-2">
        <div>
          <SectionHeading eyebrow={eyebrow} title={title} intro={intro} />
          <ul className="mt-6 space-y-3 text-sm text-muted">{points.map((p) => <li key={p} className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />{p}</li>)}</ul>
          <ButtonLink href={href} className="mt-8">{cta} <ArrowRight className="size-4" /></ButtonLink>
        </div>
        <div>{children}</div>
      </div>
    </Section>
  );
}

export function StudySection({ scholarships }: { scholarships: Scholarship[] }) {
  return (
    <PurposeBlock id="study" eyebrow="Study visas & scholarships" title="Plan your studies abroad" intro="Understand study-visa routes and find scholarships whose official pages we have actually checked."
      points={["Study-visa guidance and document preparation support", "Scholarship search and guidance — competitive and never guaranteed", "Every scholarship record links to its official source and shows when we last verified it"]}
      href="/wizard?purpose=study" cta="Start the study wizard">
      <Card className="bg-mist/60">
        <h3 className="font-bold text-navy-900">Scholarship finder preview</h3>
        {scholarships.length ? (
          <ul className="mt-4 space-y-3">
            {scholarships.slice(0, 3).map((s) => (
              <li key={s.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-line">
                <p className="flex items-center gap-2 font-bold text-navy-900">{flagOf(s.country_slug) && <Flag code={flagOf(s.country_slug)!} label={s.country_slug} className="text-lg" />}{s.name}</p>
                <p className="mt-1 text-xs text-muted">{FUNDING_LABEL[s.funding_type]}</p>
              </li>
            ))}
          </ul>
        ) : <p className="mt-3 text-sm text-muted">Records are added once their official page has been verified.</p>}
        <Link href="/scholarships" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-navy-700 hover:text-navy-900">Open the scholarship finder <ArrowRight className="size-4" /></Link>
      </Card>
    </PurposeBlock>
  );
}

export function WorkSection() {
  return (
    <PurposeBlock id="work" tone="mist" eyebrow="Work visa guidance" title="Understand your work-visa options" intro="Work routes usually depend on your occupation, qualifications and an employer. We help you understand the process and prepare."
      points={["Overview of general work-visa routes for your destination", "Help organising qualifications and experience evidence", "No promises of jobs or sponsorship — ever"]}
      href="/wizard?purpose=work" cta="Start the work wizard">
      <Card><h3 className="font-bold text-navy-900">What to have ready</h3><ul className="mt-3 space-y-2 text-sm text-muted">{["Updated CV", "Qualification certificates", "Experience letters", "Any occupation licence or assessment the route requires"].map((i) => <li key={i} className="flex gap-3"><span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-gold-500" />{i}</li>)}</ul><Link href="/tools/document-checklist?purpose=work" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-navy-700 hover:text-navy-900">Open the work checklist <ArrowRight className="size-4" /></Link></Card>
    </PurposeBlock>
  );
}

export function VisitSection({ countries }: { countries: Country[] }) {
  const picks = ["serbia", "mexico", "china"].map((s) => countries.find((c) => c.slug === s)).filter((c): c is Country => !!c);
  return (
    <PurposeBlock id="visit" eyebrow="Visitor visas & e-visas" title="Visiting Serbia, Mexico, China and more" intro="Visitor-visa and e-visa availability depends on your nationality. We point you to each destination's official portal and help you prepare."
      points={["Check eligibility for an e-visa or visa on the official portal", "Prepare itinerary, accommodation and funds evidence", "More destinations are added only after we verify their official sources"]}
      href="/wizard?purpose=visit" cta="Start the visit wizard">
      <ul className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
        {picks.map((c) => (
          <li key={c.id}><Link href={`/countries/${c.slug}`} className="flex flex-col items-center rounded-2xl border border-line bg-white p-5 text-center shadow-card transition hover:-translate-y-1 hover:border-gold-500"><Flag code={flagOf(c.slug) ?? ""} label={c.name} className="text-5xl" /><span className="mt-3 font-bold text-navy-900">{c.name}</span></Link></li>
        ))}
      </ul>
    </PurposeBlock>
  );
}

export function ToolsTeaser() {
  const tools = [
    { href: "/tools/document-checklist", t: "Document checklist tool", d: "Tick off what you have, print it, and confirm against the official list." },
    { href: "/compare", t: "Country comparison", d: "Compare official authorities, links and what we have verified." },
    { href: "/scholarships", t: "Scholarship finder", d: "Search records with funding type, source and last-verified date." },
  ];
  return (
    <Section tone="mist">
      <SectionHeading eyebrow="Planning tools" title="Free tools to plan with" intro="None of these is an official decision — they help you organise your next step." />
      <ul className="mt-10 grid gap-5 md:grid-cols-3">{tools.map((t) => <li key={t.href}><Link href={t.href}><Card className="h-full transition hover:-translate-y-1 hover:shadow-lift"><h3 className="font-bold text-navy-900">{t.t}</h3><p className="mt-2 text-sm text-muted">{t.d}</p><span className="mt-4 inline-block text-sm font-bold text-navy-700">Open →</span></Card></Link></li>)}</ul>
    </Section>
  );
}

export function OfficialResources({ countries }: { countries: Country[] }) {
  const items = countries.flatMap((c) => { const x = COUNTRY_CONTENT.find((k) => k.slug === c.slug); const l = x?.officialLinks[0]; return x && l ? [{ c, x, l }] : []; });
  return (
    <Section>
      <SectionHeading eyebrow="Official resources" title="Go straight to the source" intro="Official government pages are the only authority on rules, fees and processing times." />
      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ c, x, l }) => (
          <li key={c.slug}><a href={l.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-line bg-white p-4 text-sm font-semibold text-navy-800 shadow-sm transition hover:border-gold-500"><Flag code={x.flag} label={c.name} className="text-xl" /><span className="flex-1">{c.name} — {l.label}</span><ExternalLink className="size-4 shrink-0 text-muted" /></a></li>
        ))}
      </ul>
    </Section>
  );
}

export function ProcessSection() {
  return (
    <Section className="!py-14 sm:!py-20">
      <div className="grid items-stretch gap-8 lg:grid-cols-[1.7fr_1fr]">
        <div>
          <SectionHeading eyebrow="How it works" title="Six clear steps" intro="A transparent process from choosing your destination to receiving your deliverables. Every step is paid before it begins." />
          <ol className="mt-10 grid gap-4 sm:grid-cols-2">
            {PROCESS_STEPS.map((s, i) => (
              <li key={s.title} className="relative rounded-2xl border border-line bg-white p-5 shadow-card">
                <span className="mb-4 inline-flex size-10 items-center justify-center rounded-full bg-gold-500 text-base font-extrabold text-navy-950 ring-4 ring-gold-300/40">{i + 1}</span>
                <h3 className="font-bold text-navy-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
                
              </li>
            ))}
          </ol>
        </div>
        <div className="relative flex flex-col justify-center overflow-hidden rounded-2xl bg-navy-900 p-8 text-white shadow-lift">
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(24rem_16rem_at_100%_0%,rgb(23_59_120/0.9),transparent)]" />
          <Plane aria-hidden className="absolute -right-4 -top-2 size-28 rotate-12 text-white/10" />
          <div className="relative">
            <h3 className="text-2xl font-extrabold">Need personalised guidance?</h3>
            <p className="mt-3 text-navy-100">Tell us your goal and we will point you to the right next step.</p>
            <ButtonLink href="/book" className="mt-6">Book a consultation <ArrowRight className="size-4" /></ButtonLink>
            <Link href="/wizard" className="mt-4 block text-sm font-bold text-gold-300 underline underline-offset-4">Or find your visa options first</Link>
          </div>
        </div>
      </div>
    </Section>
  );
}

export function FeesSection({ services }: { services: Service[] }) {
  const enabled = servicesEnabled();
  return (
    <Section tone="mist" id="fees">
      <SectionHeading eyebrow="Transparent fees" title="What you pay, and what you don't" intro="Our fee covers our consultancy service only. Government, embassy and biometric fees are separate and are paid directly to the authority." />
      {enabled ? (
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Card key={s.id} className="flex flex-col">
              <h3 className="font-bold text-navy-900">{s.title}</h3>
              <div className="mt-3"><FeeLabel service={s} /></div>
              <ul className="mt-5 space-y-2 text-sm text-muted">
                {s.inclusions.slice(0, 3).map((i) => (
                  <li key={i} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />{i}</li>
                ))}
              </ul>
              <ButtonLink href={`/book?service=${s.slug}`} variant="secondary" className="mt-6">Book this service</ButtonLink>
            </Card>
          ))}
        </div>
      ) : (
        <div className="mt-10 max-w-2xl">
          <Notice tone="info" title="Fees will be published when bookings open">
            We only publish fees once our services are open for booking. Whatever the fee, it will always be shown to you before you pay, and government fees will always be listed separately.
          </Notice>
        </div>
      )}
    </Section>
  );
}

export function FaqList({ items = FAQS }: { items?: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      {items.map((f) => (
        <details key={f.q} className="group p-5 open:bg-mist/60 sm:p-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-bold text-navy-900 [&::-webkit-details-marker]:hidden">
            {f.q}
            <span aria-hidden className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-navy-100 text-lg text-navy-800 transition group-open:rotate-45">+</span>
          </summary>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export async function FaqSection() {
  const faqs = await getPublicFaqs();
  return (
    <Section>
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <SectionHeading eyebrow="FAQs" title="Questions we hear most" intro="Straight answers — including about what we cannot do." />
          <ButtonLink href="/faq" variant="secondary" className="mt-6">All FAQs</ButtonLink>
        </div>
        <FaqList items={faqs.slice(0, 5)} />
      </div>
    </Section>
  );
}

export function ContactCta() {
  const wa = whatsappLink();
  const c = site.contact;
  return (
    <Section tone="mist">
      <Card className="grid items-center gap-8 p-8 sm:p-10 md:grid-cols-[1.2fr_1fr]">
        <div>
          <h2 className="text-2xl font-extrabold text-navy-900 sm:text-3xl">Prefer to ask a question first?</h2>
          <p className="mt-3 text-muted">Send us a short message about your goal and we will point you in the right direction.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">
              <MessageCircle className="size-4" /> WhatsApp us
            </a>
          )}
          {c.email && <ButtonLink href={`mailto:${c.email}`} variant="secondary">Email us</ButtonLink>}
          {!wa && !c.email && <ButtonLink href="/contact" variant="secondary">Contact options</ButtonLink>}
        </div>
      </Card>
    </Section>
  );
}

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-navy-900 py-16 text-white sm:py-20">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(40rem_20rem_at_90%_0%,rgb(212_162_42/0.22),transparent)]" />
      <Container className="relative text-center">
        <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">Ready to understand your next step?</h2>
        <p className="mx-auto mt-4 max-w-xl text-navy-100">Book a consultation and get clear, practical guidance for your visa journey.</p>
        <div className="mt-8 flex justify-center"><ButtonLink href="/book" className="px-7 py-3.5 text-base">Book a Consultation <ArrowRight className="size-4" /></ButtonLink></div>
        <p className="mx-auto mt-6 max-w-xl text-xs text-navy-200">{site.disclaimer}</p>
      </Container>
    </section>
  );
}

export function IncludedList({ title, items, tone }: { title: string; items: string[]; tone: "yes" | "no" }) {
  const Icon = tone === "yes" ? Check : X;
  return (
    <div>
      <h4 className="text-sm font-bold uppercase tracking-wider text-navy-800">{title}</h4>
      <ul className="mt-3 space-y-2 text-sm text-muted">
        {items.map((i) => (
          <li key={i} className="flex gap-2">
            <Icon className={cx("mt-0.5 size-4 shrink-0", tone === "yes" ? "text-emerald-600" : "text-red-500")} />
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}

export { Badge };

/** "Find your visa options" band: shown under the hero and again under the services. */
export function FindOptionsBand({ className }: { className?: string }) {
  const chips = [
    { href: "/wizard?purpose=study", label: "Study" },
    { href: "/wizard?purpose=work", label: "Work" },
    { href: "/wizard?purpose=visit", label: "Visit" },
    { href: "/destinations", label: "E-visa & visa-free" },
    { href: "/umrah", label: "Umrah" },
  ];
  return (
    <section aria-labelledby="find-options" className={cx("bg-navy-900 text-white", className)}>
      <Container className="flex flex-col items-start gap-6 py-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gold-300"><Compass className="size-4" aria-hidden /> Find visa options</p>
          <h2 id="find-options" className="mt-2 text-2xl font-extrabold sm:text-3xl">Not sure which visa or destination fits you?</h2>
          <p className="mt-2 text-navy-100">Answer a few quick questions and see the guidance, services and official links that match your goal. It is not an eligibility decision.</p>
        </div>
        <div className="w-full lg:w-auto">
          <div className="flex flex-wrap gap-2">
            {chips.map((c) => <Link key={c.href} href={c.href} className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">{c.label}</Link>)}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <ButtonLink href="/wizard">Find Your Visa Options <ArrowRight className="size-4" /></ButtonLink>
            <ButtonLink href="/book" variant="outline-light"><CalendarDays className="size-4" aria-hidden /> Book a Consultation</ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}

export function DirectoryTeaser({ evisa, visaFree }: { evisa: Country[]; visaFree: Country[] }) {
  const list = [...evisa, ...visaFree].slice(0, 12);
  return (
    <Section tone="mist" className="!py-12 sm:!py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading eyebrow="Easy-entry destinations" title="E-visa and visa-free destinations" intro="Destinations that are reported to offer online e-visas, visa-free, on-arrival or electronic-authorisation entry to Pakistani passport holders. Rules change, so each page links to the official source." />
        <Link href="/destinations" className="inline-flex items-center gap-2 text-sm font-bold text-navy-700 hover:text-navy-900">See all <ArrowRight className="size-4" /></Link>
      </div>
      <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {list.map((c) => (
          <li key={c.id}>
            <Link href={`/countries/${c.slug}`} className="flex h-full flex-col items-center gap-2 rounded-xl bg-white px-3 py-4 text-center shadow-card ring-1 ring-line transition hover:-translate-y-0.5 hover:ring-gold-500">
              <Flag code={flagOf(c.slug) ?? ""} label={c.name} className="text-4xl" />
              <span className="text-sm font-bold text-navy-900">{c.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function SpiritualTeaser() {
  return (
    <Section className="!py-12 sm:!py-16">
      <div className="grid gap-5 md:grid-cols-2">
        <Card className="h-full">
          <MoonStar aria-hidden className="size-8 text-gold-600" />
          <h3 className="mt-3 text-xl font-extrabold text-navy-900">Umrah packages</h3>
          <p className="mt-2 text-muted">Plan your Umrah with clear steps, documents and approved package options.</p>
          <ButtonLink href="/umrah" variant="secondary" className="mt-5">Umrah packages <ArrowRight className="size-4" /></ButtonLink>
        </Card>
        <Card className="h-full">
          <Compass aria-hidden className="size-8 text-gold-600" />
          <h3 className="mt-3 text-xl font-extrabold text-navy-900">Holy &amp; spiritual tours</h3>
          <p className="mt-2 text-muted">Planning support for ziyarat and spiritual journeys, with official requirements explained.</p>
          <ButtonLink href="/spiritual-tours" variant="secondary" className="mt-5">Spiritual tours <ArrowRight className="size-4" /></ButtonLink>
        </Card>
      </div>
    </Section>
  );
}
