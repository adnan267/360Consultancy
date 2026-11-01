import { DEFAULT_TOURS } from "@/data/packages";
import { getRepo, isDatabaseConfigured } from "./repo";
import type { TourPackage } from "./types";

/** Published packages for the public pages. Falls back to the built-in tours when the database is not available. */
export async function getPackages(filter: { category: "tour" | "religious"; section?: string }): Promise<TourPackage[]> {
  if (isDatabaseConfigured()) {
    try {
      return await getRepo().listTourPackages({ publishedOnly: true, ...filter });
    } catch (e) {
      console.error("[packages] fallback", e);
    }
  }
  return filter.category === "tour" ? DEFAULT_TOURS : [];
}

export const formatPackagePrice = (p: Pick<TourPackage, "show_price" | "price_pkr" | "price_note">): string | null =>
  p.show_price && p.price_pkr && p.price_pkr > 0 ? `PKR ${p.price_pkr.toLocaleString("en-PK")} ${p.price_note}`.trim() : null;
