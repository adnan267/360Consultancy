import { describe, expect, it } from "vitest";
import { COUNTRY_CONTENT } from "@/data/countries";

describe("official document lists", () => {
  it("every list has a source link, a read date and items", () => {
    const withDocs = COUNTRY_CONTENT.filter((c) => c.documents?.length);
    expect(withDocs.length).toBeGreaterThan(10);
    for (const c of withDocs) {
      expect(c.documentsChecked, c.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      for (const d of c.documents!) {
        expect(d.sourceUrl, `${c.slug} ${d.purpose}`).toMatch(/^https:\/\//);
        expect(d.items.length, `${c.slug} ${d.purpose}`).toBeGreaterThan(0);
      }
    }
  });
});
