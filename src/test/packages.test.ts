import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn(), unstable_cache: <T extends (...a: never[]) => unknown>(fn: T) => fn }));
import { PUT as savePackage, DELETE as deletePackage } from "@/app/api/admin/packages/[slug]/route";
import { POST as createService } from "@/app/api/admin/services/route";
import { DEFAULT_TOURS } from "@/data/packages";
import { formatPackagePrice, getPackages } from "@/lib/packages";
import { packageSchema } from "@/lib/validation";
import type { MemoryRepo } from "@/lib/repo";
import { cookieFor, freshRepo, req } from "./helpers";

let repo: MemoryRepo;
beforeEach(() => { repo = freshRepo(); });

const base = { category: "religious", section: "umrah", title: "Umrah Economy", price_pkr: 250000, show_price: true };

describe("package rules", () => {
  it("only shows a price when it is switched on and set", () => {
    expect(formatPackagePrice({ show_price: false, price_pkr: 1000, price_note: "per person" })).toBeNull();
    expect(formatPackagePrice({ show_price: true, price_pkr: 1000, price_note: "per person" })).toContain("1,000");
    expect(packageSchema.safeParse({ ...base, price_pkr: null }).success).toBe(false);
    expect(packageSchema.safeParse({ ...base, category: "tour" }).success).toBe(false); // tour must not have a section
    expect(packageSchema.safeParse({ ...base, section: null }).success).toBe(false); // religious needs a section
    expect(packageSchema.safeParse(base).success).toBe(true);
  });
  it("returns only published packages from the database", async () => {
    await repo.saveTourPackage({ slug: "a-tour", category: "tour", section: null, title: "A tour", flag: null, country_slug: null, summary: "", highlights: [], inclusions: [], duration_days: null, price_pkr: null, price_note: "per person", show_price: false, is_published: false, sort_order: 1 });
    expect(await getPackages({ category: "tour" })).toHaveLength(0);
    expect(DEFAULT_TOURS.length).toBe(9);
  });
});

describe("admin package and service endpoints", () => {
  const ctx = (slug: string) => ({ params: Promise.resolve({ slug }) });
  it("requires an admin, then saves and deletes a package", async () => {
    expect((await savePackage(req("PUT", "/api/admin/packages/umrah-economy", { body: base }), ctx("umrah-economy"))).status).toBe(401);
    expect((await savePackage(req("PUT", "/api/admin/packages/umrah-economy", { body: base, cookie: await cookieFor("support") }), ctx("umrah-economy"))).status).toBe(403);
    expect((await savePackage(req("PUT", "/api/admin/packages/umrah-economy", { body: base, cookie: await cookieFor("admin") }), ctx("umrah-economy"))).status).toBe(200);
    expect(repo.tourPackages).toHaveLength(1);
    expect((await deletePackage(req("DELETE", "/api/admin/packages/umrah-economy", { cookie: await cookieFor("admin") }), ctx("umrah-economy"))).status).toBe(200);
    expect(repo.tourPackages).toHaveLength(0);
  });
  it("adds a new service, inactive by default, and rejects a duplicate", async () => {
    const make = async () => createService(req("POST", "/api/admin/services", { body: { slug: "resume-polish", title: "Resume Polish", summary: "We polish your resume", fee_pkr: 5000 }, cookie: await cookieFor("admin") }));
    expect((await make()).status).toBe(201);
    expect(repo.services.find((s) => s.slug === "resume-polish")?.is_active).toBe(false);
    expect((await make()).status).toBe(409);
  });
});
