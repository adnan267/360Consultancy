import { describe, expect, it } from "vitest";
import { isSameOrigin } from "@/lib/security";

const req = (origin: string | null, host: string) => new Request("https://x.test/api", { method: "POST", headers: { ...(origin ? { origin } : {}), host } });

describe("isSameOrigin", () => {
  it("accepts the host the request arrived on (www, apex) and the configured site", () => {
    expect(isSameOrigin(req("https://www.360consultancy.pk", "www.360consultancy.pk"))).toBe(true);
    expect(isSameOrigin(req("https://360consultancy.pk", "360consultancy.pk"))).toBe(true);
    expect(isSameOrigin(req("https://360consultancy.pk", "other.internal"))).toBe(true); // = siteUrl() default
  });
  it("rejects other sites and missing Origin", () => {
    expect(isSameOrigin(req("https://evil.example", "www.360consultancy.pk"))).toBe(false);
    expect(isSameOrigin(req(null, "www.360consultancy.pk"))).toBe(false);
  });
});
