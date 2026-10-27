import type { Metadata } from "next";
import { PROCESS_STEPS } from "@/data/faq";
import { FinalCta } from "@/components/sections";
import { Card, Container, Notice, PageHero } from "@/components/ui";

export const metadata: Metadata = { title: "How It Works", description: "From your first request to a confirmed consultation — our process step by step.", alternates: { canonical: "/how-it-works" } };

const statuses = [
  ["Request received", "You have submitted the form. This is not yet an appointment."],
  ["Awaiting payment", "We accepted your request and sent the agreed fee and bank-transfer instructions."],
  ["Payment under review", "You told us you paid; we are checking our bank account records."],
  ["Confirmed", "Payment verified against the bank record. Your appointment is confirmed."],
  ["In progress / Completed", "Your consultancy service is being delivered or has been delivered."],
  ["Cancelled", "The request was cancelled. See the Refund and Cancellation Policy."],
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHero eyebrow="How it works" title="A transparent process from request to confirmation" intro="You always know where your booking stands and what you are paying for." />
      <Container className="py-16">
        <ol className="grid gap-6 md:grid-cols-2">
          {PROCESS_STEPS.map((s, i) => (
            <li key={s.title}><Card className="h-full"><span className="inline-flex size-10 items-center justify-center rounded-full bg-gold-500 font-extrabold text-navy-950">{i + 1}</span><h2 className="mt-4 text-xl font-bold text-navy-900">{s.title}</h2><p className="mt-2 text-muted">{s.body}</p></Card></li>
          ))}
        </ol>
        <h2 className="mt-16 text-2xl font-extrabold text-navy-900">What each booking status means</h2>
        <dl className="mt-6 divide-y divide-line rounded-2xl border border-line bg-white shadow-card">
          {statuses.map(([t, d]) => (<div key={t} className="grid gap-1 p-5 sm:grid-cols-[14rem_1fr]"><dt className="font-bold text-navy-900">{t}</dt><dd className="text-sm text-muted">{d}</dd></div>))}
        </dl>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <Notice tone="info" title="Payment">Each step is paid online before it begins. A step opens only after the payment is confirmed by our payment partner; a screenshot never confirms anything.</Notice>
          <Notice tone="warn" title="No guarantees">We provide guidance only. Final visa decisions remain with the relevant authorities.</Notice>
        </div>
      </Container>
      <FinalCta />
    </>
  );
}
