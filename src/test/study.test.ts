import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn(), unstable_cache: <T extends (...a: never[]) => unknown>(fn: T) => fn }));
import { PUT as saveStudy, DELETE as deleteStudy } from "@/app/api/admin/study/[kind]/[slug]/route";
import { STUDY_DESTINATIONS_SEED, STUDY_SCHOLARSHIPS_SEED, UNIVERSITIES_SEED } from "@/data/study";
import { universitySchema } from "@/lib/validation";
import type { MemoryRepo } from "@/lib/repo";
import { cookieFor, freshRepo, req } from "./helpers";

let repo: MemoryRepo;
beforeEach(() => { repo = freshRepo(); });


describe("study seed data", () => {
  it("covers the requested lists", () => {
    expect(STUDY_DESTINATIONS_SEED).toHaveLength(24);
    expect(UNIVERSITIES_SEED).toHaveLength(45);
    expect(STUDY_SCHOLARSHIPS_SEED).toHaveLength(19);
  });
  it("never claims a scholarship is fully funded without an official check", () => {
    for (const s of STUDY_SCHOLARSHIPS_SEED) if (s.funding_type !== "not_stated") expect(s.last_verified).not.toBeNull();
    for (const u of UNIVERSITIES_SEED) { expect(u.ranking).toBe(""); expect(u.tuition_free_note).toBe(""); }
  });
  it("requires a source and year for a ranking", () => {
    expect(universitySchema.safeParse({ name: "X University", country_slug: "china", ranking: "10" }).success).toBe(false);
    expect(universitySchema.safeParse({ name: "X University", country_slug: "china", ranking: "10", ranking_source: "QS", ranking_year: 2026 }).success).toBe(true);
  });
});

const ctx = (kind: string, slug: string) => ({ params: Promise.resolve({ kind, slug }) });
describe("study admin API", () => {
  it("rejects anonymous and under-privileged writes", async () => {
    const b = { name: "X University", country_slug: "china" };
    expect((await saveStudy(req("PUT", "/api/admin/study/universities/x-univ", { body: b }), ctx("universities", "x-univ"))).status).toBe(401);
    expect((await saveStudy(req("PUT", "/api/admin/study/universities/x-univ", { body: b, cookie: await cookieFor("support") }), ctx("universities", "x-univ"))).status).toBe(403);
  });
  it("lets an admin add and delete a university", async () => {
    const cookie = await cookieFor("admin");
    const ok = await saveStudy(req("PUT", "/api/admin/study/universities/x-univ", { cookie, body: { name: "X University", country_slug: "china", city: "Beijing" } }), ctx("universities", "x-univ"));
    expect(ok.status).toBe(200);
    expect((await repo.listUniversities()).map((u) => u.slug)).toContain("x-univ");
    const bad = await saveStudy(req("PUT", "/api/admin/study/universities/x-univ", { cookie, body: { name: "X University", country_slug: "china", official_url: "http://insecure.example" } }), ctx("universities", "x-univ"));
    expect(bad.status).toBe(422);
    expect((await deleteStudy(req("DELETE", "/api/admin/study/universities/x-univ", { cookie }), ctx("universities", "x-univ"))).status).toBe(200);
    expect(await repo.listUniversities()).toHaveLength(0);
  });
  it("saves a scholarship and filters it", async () => {
    const cookie = await cookieFor("admin");
    const r = await saveStudy(req("PUT", "/api/admin/study/scholarships/test-sch", { cookie, body: { name: "Test Scholarship", country_slug: "china", provider: "Test", funding_type: "tuition_free", eligibility_summary: "Open to Pakistani students", official_url: "https://example.org/s" } }), ctx("scholarships", "test-sch"));
    expect(r.status).toBe(200);
    expect((await repo.listScholarships({ funding: "tuition_free" })).map((x) => x.slug)).toContain("test-sch");
  });
});
