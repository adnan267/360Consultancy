import Link from "next/link";
import { BOOKING_STATUS_LABEL, PAYMENT_STATUS_LABEL, type BookingStatus, type PaymentStatus } from "@/lib/types";
import { Badge } from "./ui";

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const tone = ({ request_received: "amber", awaiting_payment: "gold", payment_under_review: "navy", confirmed: "green", in_progress: "navy", completed: "green", cancelled: "gray" } as const)[status];
  return <Badge tone={tone}>{BOOKING_STATUS_LABEL[status]}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const tone = ({ awaiting: "gray", under_review: "navy", verified: "green", rejected: "red", refunded: "amber" } as const)[status];
  return <Badge tone={tone}>{PAYMENT_STATUS_LABEL[status]}</Badge>;
}

export function pkt(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Karachi", dateStyle: "medium", timeStyle: "short" });
}

export function AdminLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="rounded-lg px-3 py-2 text-sm font-semibold text-navy-100 transition hover:bg-white/10 hover:text-white">{children}</Link>;
}
