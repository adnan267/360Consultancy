"use client";

import { CheckCircle2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ButtonLink, Card, Notice } from "./ui";

interface Stored { reference: string; consultancyFeePkr: number; governmentFeesPkr: number; totalPayablePkr: number; isStartingPrice: boolean }
const REF = /^360-[A-HJKMNP-Z2-9]{8}$/;

export function ConfirmationView() {
  const ref = useSearchParams().get("ref") ?? "";
  const [stored, setStored] = useState<Stored | null>(null);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("360-booking");
      const parsed = raw ? (JSON.parse(raw) as Stored) : null;
      if (parsed && parsed.reference === ref) setStored(parsed);
    } catch { /* ignore */ }
  }, [ref]);

  if (!REF.test(ref)) {
    return (
      <Card className="mx-auto max-w-xl text-center">
        <h1 className="text-2xl font-extrabold text-navy-900">No booking to show</h1>
        <p className="mt-3 text-muted">This page appears after you submit a booking request.</p>
        <ButtonLink href="/book" className="mt-6">Make a booking request</ButtonLink>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="text-center">
        <CheckCircle2 className="mx-auto size-12 text-emerald-600" aria-hidden />
        <h1 className="mt-4 text-3xl font-extrabold text-navy-900">Request received</h1>
        <p className="mt-2 text-muted">Your booking reference is</p>
        <p className="mt-1 select-all font-mono text-3xl font-bold tracking-wider text-navy-900">{ref}</p>
        <p className="mt-2 text-xs text-muted">Please keep this — you will need it for payment and any correspondence.</p>
      </Card>

      <Notice tone="warn" title="This is a request, not a confirmed appointment">
        We will review it and email payment instructions. <strong>Please do not pay until you receive them.</strong> Your appointment is confirmed only after we verify your payment in our bank records.
      </Notice>

      {stored && (
        <Card>
          <h2 className="font-bold text-navy-900">Fee breakdown</h2>
          <dl className="mt-3 divide-y divide-line text-sm">
            <div className="flex justify-between py-2"><dt className="text-muted">Consultancy fee{stored.isStartingPrice ? " (starting price)" : ""}</dt><dd className="font-semibold">PKR {stored.consultancyFeePkr.toLocaleString("en-PK")}</dd></div>
            <div className="flex justify-between py-2"><dt className="text-muted">Government / embassy fees</dt><dd className="font-semibold">Paid by you to the authority</dd></div>
            <div className="flex justify-between py-2"><dt className="font-semibold text-navy-900">Payable to 360 Consultancy</dt><dd className="font-extrabold text-navy-900">PKR {stored.totalPayablePkr.toLocaleString("en-PK")}</dd></div>
          </dl>
        </Card>
      )}

      <Card>
        <h2 className="font-bold text-navy-900">What happens next</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted">
          <li>We review your request.</li>
          <li>We email you the agreed fee and bank-transfer instructions, quoting your reference.</li>
          <li>You transfer the fee. We check it against our actual bank account records.</li>
          <li>We confirm your booking and deliver the service.</li>
        </ol>
      </Card>
      <div className="text-center"><ButtonLink href="/" variant="secondary">Back to home</ButtonLink></div>
    </div>
  );
}
