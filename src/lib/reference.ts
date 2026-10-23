import { randomInt } from "node:crypto";

// No 0/O/1/I/L to avoid transcription errors when quoting in a bank transfer.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Server-generated booking reference, e.g. 360-7K3M9QXD (cryptographically random). */
export function generateBookingReference(): string {
  let out = "";
  for (let i = 0; i < 8; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return `360-${out}`;
}

export const BOOKING_REF_PATTERN = /^360-[A-HJKMNP-Z2-9]{8}$/;

/** Server-generated case reference, e.g. CASE-7K3M9QXD. Quoted by the client in bank transfers. */
export function generateCaseReference(): string {
  let out = "";
  for (let i = 0; i < 8; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return `CASE-${out}`;
}
