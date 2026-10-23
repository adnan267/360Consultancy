import { beforeEach, describe, expect, it } from "vitest";
import { hashPassword, signSession, verifySessionToken } from "@/lib/auth";
import { createBookingRequest } from "@/lib/bookings";
import { GET as exportCsv } from "@/app/api/admin/export/route";
import { PATCH as patchBooking } from "@/app/api/admin/bookings/[id]/route";
import { PATCH as patchService } from "@/app/api/admin/services/[id]/route";
import { POST as login } from "@/app/api/admin/login/route";
import { POST as changePassword } from "@/app/api/admin/password/route";
import { verifyPassword } from "@/lib/auth";
import { POST as createBooking } from "@/app/api/bookings/route";
import { SignJWT } from "jose";
import type { MemoryRepo } from "@/lib/repo";
import { cookieFor, freshRepo, req, validBooking } from "./helpers";

let repo: MemoryRepo;
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const ZERO = "00000000-0000-4000-8000-000000000000";

beforeEach(() => {
  repo = freshRepo();
  process.env.SERVICES_ENABLED = "true";
});

describe("unauthenticated admin requests are rejected", () => {
  it("PATCH booking → 401", async () => {
    const r = await patchBooking(req("PATCH", `/api/admin/bookings/${ZERO}`, { body: { action: "add_note", note: "x" } }), ctx(ZERO));
    expect(r.status).toBe(401);
  });
  it("export → 401", async () => {
    expect((await exportCsv(req("GET", "/api/admin/export"))).status).toBe(401);
  });
  it("service patch → 401", async () => {
    expect((await patchService(req("PATCH", `/api/admin/services/${ZERO}`, { body: { fee_pkr: 1 } }), ctx(ZERO))).status).toBe(401);
  });
  it("forged / expired / wrong-secret tokens → 401", async () => {
    const forged = await new SignJWT({ email: "a@b.c", role: "admin" }).setProtectedHeader({ alg: "HS256" }).setSubject(ZERO).setExpirationTime("1h").sign(new TextEncoder().encode("x".repeat(40)));
    const expired = await new SignJWT({ email: "a@b.c", role: "admin" }).setProtectedHeader({ alg: "HS256" }).setSubject(ZERO).setIssuedAt(1).setExpirationTime(2).sign(new TextEncoder().encode(process.env.SESSION_SECRET!));
    for (const t of [forged, expired, "garbage"]) {
      expect((await exportCsv(req("GET", "/api/admin/export", { cookie: `admin_session=${t}` }))).status).toBe(401);
    }
  });
  it("token with unknown role is not accepted", async () => {
    const t = await new SignJWT({ email: "a@b.c", role: "root" }).setProtectedHeader({ alg: "HS256" }).setSubject(ZERO).setExpirationTime("1h").sign(new TextEncoder().encode(process.env.SESSION_SECRET!));
    expect(await verifySessionToken(t)).toBeNull();
  });
});

describe("role-based authorisation", () => {
  it("staff cannot export, edit services, or verify payments", async () => {
    const staff = await cookieFor("staff");
    expect((await exportCsv(req("GET", "/api/admin/export", { cookie: staff }))).status).toBe(403);
    expect((await patchService(req("PATCH", `/api/admin/services/${ZERO}`, { cookie: staff, body: { fee_pkr: 1 } }), ctx(ZERO))).status).toBe(403);
    const r = await patchBooking(req("PATCH", `/api/admin/bookings/${ZERO}`, { cookie: staff, body: { action: "update_payment", status: "verified", bankReference: "ABC", receivedAmountPkr: 1 } }), ctx(ZERO));
    expect(r.status).toBe(403);
  });
  it("admin can export CSV (and it is audited)", async () => {
    await createBookingRequest(validBooking(), { ip: "5.5.5.5" });
    const r = await exportCsv(req("GET", "/api/admin/export", { cookie: await cookieFor("admin") }));
    expect(r.status).toBe(200);
    const text = await r.text();
    expect(text.split("\r\n")[0]).toContain("reference");
    expect(text).toContain("ayesha@example.com");
    expect(repo.audit.some((a) => a.action === "csv_export")).toBe(true);
  });
  it("admin status update works end-to-end through the route", async () => {
    await createBookingRequest(validBooking(), { ip: "6.6.6.6" });
    const id = repo.bookings[0]!.id;
    const r = await patchBooking(req("PATCH", `/api/admin/bookings/${id}`, { cookie: await cookieFor("admin"), body: { action: "set_status", status: "awaiting_payment" } }), ctx(id));
    expect(r.status).toBe(200);
    expect(repo.bookings[0]!.status).toBe("awaiting_payment");
  });
  it("rejects malformed ids and bodies", async () => {
    const cookie = await cookieFor("admin");
    expect((await patchBooking(req("PATCH", "/api/admin/bookings/not-a-uuid", { cookie, body: {} }), ctx("not-a-uuid"))).status).toBe(404);
    expect((await patchBooking(req("PATCH", `/api/admin/bookings/${ZERO}`, { cookie, body: { action: "hack" } }), ctx(ZERO))).status).toBe(422);
  });
});

describe("origin / CSRF protection", () => {
  it("rejects mutating requests without or with a foreign Origin", async () => {
    const cookie = await cookieFor("admin");
    expect((await patchBooking(req("PATCH", `/api/admin/bookings/${ZERO}`, { cookie, origin: null, body: { action: "add_note", note: "x" } }), ctx(ZERO))).status).toBe(403);
    expect((await patchBooking(req("PATCH", `/api/admin/bookings/${ZERO}`, { cookie, origin: "https://evil.example", body: { action: "add_note", note: "x" } }), ctx(ZERO))).status).toBe(403);
    expect((await createBooking(req("POST", "/api/bookings", { origin: "https://evil.example", body: validBooking() }))).status).toBe(403);
  });
});

describe("public booking endpoint", () => {
  it("returns 503 while the feature flag is off", async () => {
    delete process.env.SERVICES_ENABLED;
    const r = await createBooking(req("POST", "/api/bookings", { body: validBooking() }));
    expect(r.status).toBe(503);
    expect(repo.bookings).toHaveLength(0);
  });
  it("201 with server-calculated amount; never echoes private data", async () => {
    const r = await createBooking(req("POST", "/api/bookings", { body: validBooking() }));
    expect(r.status).toBe(201);
    const body = await r.json();
    expect(body.booking.totalPayablePkr).toBe(1500);
    expect(JSON.stringify(body)).not.toContain("ayesha");
  });
  it("422 with field errors on invalid input; 413 on oversize; 400 on bad JSON", async () => {
    const bad = await createBooking(req("POST", "/api/bookings", { body: validBooking({ email: "x" }) }));
    expect(bad.status).toBe(422);
    expect((await bad.json()).fields.email).toBeTruthy();
    const big = await createBooking(req("POST", "/api/bookings", { body: { message: "x".repeat(40_000) } }));
    expect(big.status).toBe(413);
    const badJson = await createBooking(new Request("https://360consultancy.pk/api/bookings", { method: "POST", headers: { origin: "https://360consultancy.pk" }, body: "{nope" }));
    expect(badJson.status).toBe(400);
  });
});

describe("admin login", () => {
  beforeEach(async () => {
    repo.admins.push({ id: "11111111-1111-4111-8111-111111111111", email: "owner@example.com", password_hash: await hashPassword("correct horse battery"), role: "admin", is_active: true });
  });
  it("sets a secure httpOnly strict cookie on success", async () => {
    const r = await login(req("POST", "/api/admin/login", { body: { email: "Owner@Example.com", password: "correct horse battery" } }));
    expect(r.status).toBe(200);
    const c = r.headers.get("set-cookie")!;
    expect(c).toMatch(/HttpOnly/);
    expect(c).toMatch(/SameSite=Strict/);
    const token = decodeURIComponent(c.split(";")[0]!.split("=").slice(1).join("="));
    expect((await verifySessionToken(token))?.role).toBe("admin");
  });
  it("uses one generic error for wrong password and unknown email", async () => {
    const a = await login(req("POST", "/api/admin/login", { body: { email: "owner@example.com", password: "wrong" } }));
    const b = await login(req("POST", "/api/admin/login", { body: { email: "nobody@example.com", password: "wrong" } }));
    expect(a.status).toBe(401);
    expect(b.status).toBe(401);
    expect(await a.json()).toEqual(await b.json());
    expect(a.headers.get("set-cookie")).toBeNull();
  });
  it("blocks inactive accounts", async () => {
    repo.admins[0]!.is_active = false;
    expect((await login(req("POST", "/api/admin/login", { body: { email: "owner@example.com", password: "correct horse battery" } }))).status).toBe(401);
  });
  it("rate limits repeated failures even when the password is then correct", async () => {
    let last = 0;
    for (let i = 0; i < 7; i++) last = (await login(req("POST", "/api/admin/login", { body: { email: "owner@example.com", password: "bad" + i } }))).status;
    expect(last).toBe(429);
    expect((await login(req("POST", "/api/admin/login", { body: { email: "owner@example.com", password: "correct horse battery" } }))).status).toBe(429);
  });
  it("round-trips session tokens", async () => {
    const t = await signSession({ sub: "s", email: "e@x.y", role: "staff" });
    expect(await verifySessionToken(t)).toEqual({ sub: "s", email: "e@x.y", role: "staff" });
  });
});

describe("admin change password", () => {
  const ID = "11111111-1111-4111-8111-111111111111";
  beforeEach(async () => {
    repo.admins.push({ id: ID, email: "owner@example.com", password_hash: await hashPassword("correct horse battery"), role: "admin", is_active: true });
  });
  const cookie = async () => ({ cookie: `admin_session=${encodeURIComponent(await signSession({ sub: ID, email: "owner@example.com", role: "admin" }))}` });
  it("requires a session", async () => {
    expect((await changePassword(req("POST", "/api/admin/password", { body: { current_password: "a", new_password: "b".repeat(12) } }))).status).toBe(401);
  });
  it("rejects a wrong current password and short new passwords", async () => {
    const h = await cookie();
    const wrong = await changePassword(req("POST", "/api/admin/password", { ...h, body: { current_password: "nope", new_password: "a-brand-new-passphrase" } }));
    expect(wrong.status).toBe(400);
    const short = await changePassword(req("POST", "/api/admin/password", { ...h, body: { current_password: "correct horse battery", new_password: "short" } }));
    expect(short.status).toBe(400);
    expect(await verifyPassword("correct horse battery", repo.admins[0]!.password_hash)).toBe(true);
  });
  it("changes the password and logs the old one out", async () => {
    const h = await cookie();
    const ok = await changePassword(req("POST", "/api/admin/password", { ...h, body: { current_password: "correct horse battery", new_password: "a-brand-new-passphrase" } }));
    expect(ok.status).toBe(200);
    expect(await verifyPassword("a-brand-new-passphrase", repo.admins[0]!.password_hash)).toBe(true);
    expect((await login(req("POST", "/api/admin/login", { body: { email: "owner@example.com", password: "correct horse battery" } }))).status).toBe(401);
    expect((await login(req("POST", "/api/admin/login", { body: { email: "owner@example.com", password: "a-brand-new-passphrase" } }))).status).toBe(200);
  });
});
