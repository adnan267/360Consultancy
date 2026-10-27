import { ArrowRight, BadgeCheck, FileText, Lock, ShieldCheck } from "lucide-react";
import { ButtonLink, Container, Disclaimer } from "./ui";

const points = [
  { Icon: BadgeCheck, label: ["Honest", "guidance"] },
  { Icon: FileText, label: ["Official", "sources first"] },
  { Icon: ShieldCheck, label: ["Transparent", "fees"] },
  { Icon: Lock, label: ["Privacy-", "minded"] },
];

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-navy-950 text-white">
      {/* Artwork sits on the right and fades into navy so text always stays legible. */}
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 -z-10 w-full bg-cover bg-[position:60%_40%] opacity-60 sm:opacity-80 lg:w-[92%] lg:bg-right lg:opacity-100"
        style={{ backgroundImage: "url(/brand/hero-art.jpg)" }}
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#061330_0%,rgb(6_19_48/0.92)_30%,rgb(6_19_48/0.3)_52%,transparent_70%)] max-lg:bg-[linear-gradient(180deg,rgb(6_19_48/0.92),rgb(6_19_48/0.7))]" />

      <Container className="relative py-12 sm:py-16 lg:py-14">
        <div className="max-w-xl lg:max-w-[40rem]">
          <p className="mb-5 inline-block rounded-md bg-gold-400 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-navy-950">
            Visa guidance, honestly explained
          </p>
          <h1 className="text-4xl font-black uppercase leading-[1.04] tracking-tight text-balance sm:text-5xl lg:text-[2.85rem]">
            Your global journey starts <span className="block">with <span className="text-gold-400">the right guidance.</span></span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/90 text-pretty sm:text-lg">
            Understand your options, organise your documents and prepare for your next step — to travel, study or work abroad — with clear, practical guidance.
          </p>

          <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-0 sm:divide-x sm:divide-white/20">
            {points.map(({ Icon, label }) => (
              <li key={label.join("")} className="flex items-center gap-2.5 sm:px-3 sm:first:pl-0">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-gold-400 text-gold-300">
                  <Icon className="size-[18px]" />
                </span>
                <span className="text-xs font-semibold leading-tight">
                  {label[0]}
                  <br />
                  {label[1]}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <ButtonLink href="/wizard" className="px-6 py-3.5 text-base">
              Find Your Visa Options <ArrowRight className="size-4" />
            </ButtonLink>
            <ButtonLink href="/book" variant="secondary" className="px-6 py-3.5 text-base">
              Book a Consultation
            </ButtonLink>
            <ButtonLink href="/services" variant="outline-light" className="rounded-full px-6 py-3.5 text-base">
              Explore Services
            </ButtonLink>
          </div>
          <Disclaimer light className="mt-6 max-w-md !text-xs" />
        </div>
      </Container>
    </section>
  );
}
