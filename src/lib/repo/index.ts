import bcrypt from "bcryptjs";
import { supabaseConfig } from "../env";
import { MemoryRepo } from "./memory";
import { SupabaseRepo } from "./supabase";
import type { Repo } from "./types";

let override: Repo | null = null;
let supa: Repo | null = null;

/** Tests inject an in-memory repo here. */
export function setRepoForTests(r: Repo | null) {
  override = r;
}

/**
 * LOCAL UI WORK ONLY: DEV_MEMORY_DB=true with `next dev` serves an in-memory database
 * (and a seeded dev admin). Hard-disabled in production builds.
 */
export function devMemoryEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.DEV_MEMORY_DB === "true";
}
// Pinned on globalThis: Next bundles pages and route handlers separately, so a module-level singleton would be duplicated.
const g = globalThis as unknown as { __devRepo?: MemoryRepo };
function devMemory(): MemoryRepo {
  if (!g.__devRepo) {
    const devRepo = (g.__devRepo = new MemoryRepo());
    devRepo.admins.push({ id: "11111111-1111-4111-8111-111111111111", email: "dev@example.com", password_hash: bcrypt.hashSync("dev-password-123", 4), role: "admin", is_active: true });
  }
  return g.__devRepo;
}

export function isDatabaseConfigured(): boolean {
  return override !== null || devMemoryEnabled() || supabaseConfig() !== null;
}

/** Throws if no database is configured; callers that can degrade should check isDatabaseConfigured() first. */
export function getRepo(): Repo {
  if (override) return override;
  if (devMemoryEnabled()) return devMemory();
  if (!supabaseConfig()) throw new Error("Database is not configured");
  return (supa ??= new SupabaseRepo());
}

export { MemoryRepo };
export type { Repo };
