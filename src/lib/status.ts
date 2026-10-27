import type { BookingStatus, PaymentStatus, Role } from "./types";

/** Allowed booking status transitions. Anything not listed is rejected server-side. */
export const BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  request_received: ["awaiting_payment", "cancelled"],
  awaiting_payment: ["payment_under_review", "cancelled"],
  payment_under_review: ["confirmed", "awaiting_payment", "cancelled"],
  confirmed: ["in_progress", "completed", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export const PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  awaiting: ["under_review"],
  under_review: ["verified", "rejected"],
  rejected: ["under_review"],
  verified: ["refunded"],
  refunded: [],
};

export function canTransitionBooking(from: BookingStatus, to: BookingStatus): boolean {
  return BOOKING_TRANSITIONS[from].includes(to);
}

export function canTransitionPayment(from: PaymentStatus, to: PaymentStatus): boolean {
  return PAYMENT_TRANSITIONS[from].includes(to);
}

export type Permission =
  | "booking:view"
  | "booking:note"
  | "booking:status"
  | "payment:verify"
  | "service:manage"
  | "export:csv"
  | "audit:view"
  | "lead:view"
  | "lead:manage"
  | "case:view"
  | "case:manage"
  | "settings:manage"
  | "document:view"
  | "case:message"
  | "content:manage"
  | "team:manage";

const ALL_PERMISSIONS: Permission[] = ["booking:view", "booking:note", "booking:status", "payment:verify", "service:manage", "export:csv", "audit:view", "lead:view", "lead:manage", "case:view", "case:manage", "settings:manage", "document:view", "case:message", "content:manage", "team:manage"];

/** Least privilege: finance cannot open client documents; support cannot open them or move money; consultants cannot verify payments. */
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: ALL_PERMISSIONS,
  staff: ["booking:view", "booking:note", "booking:status", "lead:view", "lead:manage", "case:view", "case:manage", "document:view", "case:message"],
  consultant: ["booking:view", "booking:note", "booking:status", "lead:view", "lead:manage", "case:view", "case:manage", "document:view", "case:message"],
  finance: ["booking:view", "payment:verify", "export:csv", "audit:view", "case:view", "case:manage"],
  support: ["booking:view", "booking:note", "lead:view", "lead:manage", "case:view", "case:message"],
};

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
