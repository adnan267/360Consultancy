import { describe, expect, it } from "vitest";
import { bookingRequestSchema } from "@/lib/validation";
import { BOOKING_REF_PATTERN, generateBookingReference } from "@/lib/reference";
import { csvCell } from "@/lib/csv";
import { futureParts, validBooking } from "./helpers";

describe("booking validation", () => {
  it("accepts a valid request and lowercases the email", () => {
    const r = bookingRequestSchema.safeParse(validBooking());
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("ayesha@example.com");
  });
  it("rejects browser-supplied pricing or any unknown field", () => {
    expect(bookingRequestSchema.safeParse(validBooking({ fee: 1 })).success).toBe(false);
    expect(bookingRequestSchema.safeParse(validBooking({ price: 1 })).success).toBe(false);
    expect(bookingRequestSchema.safeParse(validBooking({ passportNumber: "AB1234567" })).success).toBe(false);
  });
  it("requires both consents", () => {
    expect(bookingRequestSchema.safeParse(validBooking({ consentPrivacy: false })).success).toBe(false);
    expect(bookingRequestSchema.safeParse(validBooking({ consentTerms: false })).success).toBe(false);
  });
  it("rejects bad email, phone and short name", () => {
    expect(bookingRequestSchema.safeParse(validBooking({ email: "nope" })).success).toBe(false);
    expect(bookingRequestSchema.safeParse(validBooking({ phone: "abc" })).success).toBe(false);
    expect(bookingRequestSchema.safeParse(validBooking({ fullName: "A" })).success).toBe(false);
  });
  it("rejects past dates and dates beyond 90 days", () => {
    expect(bookingRequestSchema.safeParse(validBooking({ preferredDate: "2020-01-01" })).success).toBe(false);
    expect(bookingRequestSchema.safeParse(validBooking(futureParts(200))).success).toBe(false);
  });
  it("limits message length", () => {
    expect(bookingRequestSchema.safeParse(validBooking({ message: "x".repeat(1001) })).success).toBe(false);
  });
});

describe("references and csv", () => {
  it("generates well-formed unique references", () => {
    const set = new Set(Array.from({ length: 500 }, generateBookingReference));
    expect(set.size).toBe(500);
    for (const r of set) expect(r).toMatch(BOOKING_REF_PATTERN);
  });
  it("neutralises CSV formula injection and escapes quotes", () => {
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell("+1")).toBe("'+1");
    expect(csvCell('a,"b"')).toBe('"a,""b"""');
  });
});
