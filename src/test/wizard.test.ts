import { beforeEach, describe, expect, it } from "vitest";
import { POST as postLead } from "@/app/api/leads/route";
import { PATCH as patchLead } from "@/app/api/admin/leads/[id]/route";
import { createLead } from "@/lib/leads";
import { activeSteps, leadPriority, suggest, validateStep } from "@/lib/wizard";
import { getPublicScholarships } from "@/lib/catalog";
import type { MemoryRepo } from "@/lib/repo";
import { cookieFor, freshRepo, req } from "./helpers";

let repo: MemoryRepo;
beforeEach(() => {
  repo = freshRepo();
  delete process.env.LEADS_ENABLED;
});

const answers = { purpose: "study", destination: "canada", educationLevel: "bachelor", targetLevel: "master", englishTest: "planning", budgetBand: "unsure", fundingSource: "scholarship", timeline: "asap", wantsScholarshipHelp: true };
const contact = { name: "Ayesha Khan", email: "Ayesha@Example.com", phone: "+92 300 1234567", consentPrivacy: true, website: "" };

describe("wizard step validation", () => {
  it("requires purpose and destination", () => {
    expect(validateStep("purpose", {})).toHaveProperty("purpose");
    expect(validateStep("destination", { purpose: "study" })).toHaveProperty("destination");
    expect(validateStep("purpose", { purpose: "study" })).toEqual({});
  });
  it("skips the profile step when unsure", () => {
    expect(activeSteps({ purpose: "unsure" })).not.toContain("profile");
    expect(activeSteps({ purpose: "study" })).toContain("profile");
  });
});

describe("readiness and priority", () => {
  it("requires passport, documents, timeline and service level", () => {
    expect(validateStep("readiness", {})).toHaveProperty("passportStatus");
    expect(validateStep("readiness", {})).toHaveProperty("docsStatus");
    expect(validateStep("support", {})).toHaveProperty("serviceLevel");
  });
  it("skips profile for business and holy tours", () => {
    expect(activeSteps({ purpose: "business" })).not.toContain("profile");
    expect(activeSteps({ purpose: "spiritual" })).toContain("readiness");
  });
  it("scores hot, warm and cold leads and flags passport problems", () => {
    expect(leadPriority({ timeline: "asap", passportStatus: "valid_6m", docsStatus: "ready", serviceLevel: "full" }).priority).toBe("hot");
    expect(leadPriority({ timeline: "3_to_6_months", passportStatus: "expiring", docsStatus: "partial", serviceLevel: "review" }).priority).toBe("warm");
    const c = leadPriority({ timeline: "flexible", passportStatus: "none", docsStatus: "none", serviceLevel: "guidance" });
    expect(c.priority).toBe("cold");
    expect(c.flags).toContain("no valid passport");
  });
  it("stores priority with the lead", async () => {
    process.env.LEADS_ENABLED = "true";
    const a = { ...answers, passportStatus: "valid_6m", docsStatus: "ready", serviceLevel: "full" };
    expect((await createLead({ answers: a, contact }, { ip: "9.9.9.9" })).ok).toBe(true);
    const { rows } = await repo.listLeads({ limit: 10, offset: 0 });
    expect(rows[0].answers.priority).toBe("hot");
  });
});

describe("wizard suggestions", () => {
  it("always includes the disclaimer and never promises outcomes", () => {
    const s = suggest(answers as never);
    expect(s.notes[0]).toMatch(/not an eligibility assessment/i);
    expect(JSON.stringify(s)).not.toMatch(/guarantee(d)? (approval|visa)/i);
  });
  it("links scholarship finder only for study with scholarship interest", () => {
    expect(suggest(answers as never).links.some((l) => l.href.startsWith("/scholarships"))).toBe(true);
    expect(suggest({ purpose: "work", destination: "canada" }).links.some((l) => l.href.startsWith("/scholarships"))).toBe(false);
  });
});

describe("createLead", () => {
  it("is disabled by default", async () => {
    const r = await createLead({ answers, contact }, { ip: "1.1.1.1" });
    expect(r).toMatchObject({ ok: false, status: 503 });
    expect((await repo.listLeads({ limit: 10, offset: 0 })).total).toBe(0);
  });
  it("saves when enabled, normalising email and recomputing suggestions", async () => {
    process.env.LEADS_ENABLED = "true";
    const r = await createLead({ answers, contact }, { ip: "1.1.1.1" });
    expect(r.ok).toBe(true);
    const { rows } = await repo.listLeads({ limit: 10, offset: 0 });
    expect(rows).toHaveLength(1);
    expect(rows[0].email).toBe("ayesha@example.com");
    expect(rows[0].suggested_services).toContain("visa-guidance-session");
  });
  it("rejects invalid, unknown-field and no-consent payloads", async () => {
    process.env.LEADS_ENABLED = "true";
    expect(await createLead({ answers, contact: { ...contact, consentPrivacy: false } }, { ip: "2.2.2.2" })).toMatchObject({ ok: false, status: 422 });
    expect(await createLead({ answers: { ...answers, destination: "mars" }, contact }, { ip: "2.2.2.2" })).toMatchObject({ ok: false, status: 422 });
    expect(await createLead({ answers, contact, extra: 1 }, { ip: "2.2.2.2" })).toMatchObject({ ok: false, status: 422 });
  });
  it("honeypot pretends success but stores nothing", async () => {
    process.env.LEADS_ENABLED = "true";
    const r = await createLead({ answers, contact: { ...contact, website: "http://spam" } }, { ip: "3.3.3.3" });
    expect(r.ok).toBe(true);
    expect((await repo.listLeads({ limit: 10, offset: 0 })).total).toBe(0);
  });
  it("rate-limits per email", async () => {
    process.env.LEADS_ENABLED = "true";
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await createLead({ answers, contact }, { ip: `9.9.9.${i}` }));
    expect(results.slice(0, 3).every((r) => r.ok)).toBe(true);
    expect(results[3]).toMatchObject({ ok: false, status: 429 });
  });
});

describe("/api/leads and admin lead route", () => {
  it("rejects cross-origin posts", async () => {
    process.env.LEADS_ENABLED = "true";
    expect((await postLead(req("POST", "/api/leads", { body: { answers, contact }, origin: "https://evil.example" }))).status).toBe(403);
  });
  it("accepts a valid post when enabled", async () => {
    process.env.LEADS_ENABLED = "true";
    expect((await postLead(req("POST", "/api/leads", { body: { answers, contact } }))).status).toBe(201);
  });
  it("admin lead status needs a session", async () => {
    const id = "00000000-0000-4000-8000-000000000000";
    const ctx = { params: Promise.resolve({ id }) };
    expect((await patchLead(req("PATCH", `/api/admin/leads/${id}`, { body: { status: "contacted" } }), ctx)).status).toBe(401);
    expect((await patchLead(req("PATCH", `/api/admin/leads/${id}`, { body: { status: "contacted" }, cookie: await cookieFor("staff") }), ctx)).status).toBe(404);
  });
});

describe("scholarship catalogue", () => {
  it("only returns verified, published records with an official link", async () => {
    const list = await getPublicScholarships();
    expect(list.length).toBeGreaterThan(0);
    for (const s of list) {
      expect(s.is_published).toBe(true);
      expect(s.official_url).toMatch(/^https:\/\//);
    }
  });
  it("filters by country", async () => {
    const list = await getPublicScholarships({ country: "serbia" });
    expect(list.every((s) => s.country_slug === "serbia")).toBe(true);
  });
});
