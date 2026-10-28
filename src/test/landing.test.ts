import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn(), unstable_cache: <T extends (...a: never[]) => unknown>(fn: T) => fn }));
import { DELETE as lpDelete, PUT as lpPut } from "@/app/api/admin/landing-pages/[slug]/route";
import { getPublicLanding, listPublicLandingSlugs } from "@/lib/landing";
import type { MemoryRepo } from "@/lib/repo";
import { cookieFor, freshRepo, req } from "./helpers";

let repo: MemoryRepo;
beforeEach(() => { repo = freshRepo(); });

const page = { purpose: "study", title: "UK student visa", headline: "Plan your UK study visa", sub: "Clear steps.", bullets: ["Checklist", "Review"], faqs: [{ q: "Do you guarantee?", a: "No, never." }], destination: "united-kingdom" };
const put = async (slug: string, body: object, role = "admin") => lpPut(req("PUT", `/api/admin/landing-pages/${slug}`, { cookie: await cookieFor(role as never), body }), { params: Promise.resolve({ slug }) });

describe("admin landing pages", () => {
  it("serves built-in pages until an admin overrides, hides or resets them", async () => {
    expect(await getPublicLanding("study-abroad")).toMatchObject({ slug: "study-abroad", purpose: "study" });
    expect((await put("study-abroad", page)).status).toBe(200);
    expect(await getPublicLanding("study-abroad")).toMatchObject({ headline: "Plan your UK study visa", destination: "united-kingdom" });
    expect((await put("study-abroad", { ...page, is_published: false })).status).toBe(200);
    expect(await getPublicLanding("study-abroad")).toBe("hidden");
    expect(await listPublicLandingSlugs()).not.toContain("study-abroad");
    const del = await lpDelete(req("DELETE", "/api/admin/landing-pages/study-abroad", { cookie: await cookieFor("admin") }), { params: Promise.resolve({ slug: "study-abroad" }) });
    expect(del.status).toBe(200);
    expect(await getPublicLanding("study-abroad")).toMatchObject({ title: "Study abroad guidance" });
  });

  it("creates new pages, validates input and requires content permission", async () => {
    expect((await put("uk-student-visa", page)).status).toBe(200);
    expect(await listPublicLandingSlugs()).toContain("uk-student-visa");
    expect(repo.landingPages).toHaveLength(1);
    expect((await put("Bad Slug", page)).status).toBe(422);
    expect((await put("x", { ...page, destination: "atlantis" })).status).toBe(422);
    expect((await put("x", { ...page, evil: true })).status).toBe(422);
    expect((await put("x", page, "consultant")).status).toBe(403);
  });
});
