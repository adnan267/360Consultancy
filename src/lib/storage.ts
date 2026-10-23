import { serviceDb } from "./repo/supabase";
import { supabaseConfig } from "./env";
import { devMemoryEnabled } from "./repo";

/** Private document storage. Files are only ever served through authenticated API routes. */
export interface FileStorage {
  put(path: string, bytes: Uint8Array, mime: string): Promise<void>;
  get(path: string): Promise<Uint8Array | null>;
  remove(path: string): Promise<void>;
}

const BUCKET = "case-documents";

class SupabaseStorage implements FileStorage {
  async put(path: string, bytes: Uint8Array, mime: string) {
    const { error } = await serviceDb().storage.from(BUCKET).upload(path, bytes, { contentType: mime, upsert: false });
    if (error) {
      console.error("[storage] put", error.message);
      throw new Error("Storage error");
    }
  }
  async get(path: string) {
    const { data, error } = await serviceDb().storage.from(BUCKET).download(path);
    if (error || !data) return null;
    return new Uint8Array(await data.arrayBuffer());
  }
  async remove(path: string) {
    const { error } = await serviceDb().storage.from(BUCKET).remove([path]);
    if (error) console.error("[storage] remove", error.message);
  }
}

export class MemoryStorage implements FileStorage {
  files = new Map<string, { bytes: Uint8Array; mime: string }>();
  async put(path: string, bytes: Uint8Array, mime: string) {
    this.files.set(path, { bytes, mime });
  }
  async get(path: string) {
    return this.files.get(path)?.bytes ?? null;
  }
  async remove(path: string) {
    this.files.delete(path);
  }
}

let override: FileStorage | null = null;
let real: FileStorage | null = null;
const gs = globalThis as unknown as { __devStore?: MemoryStorage };
export function setStorageForTests(s: FileStorage | null) {
  override = s;
}
export function isStorageConfigured() {
  return override !== null || devMemoryEnabled() || supabaseConfig() !== null;
}
export function getStorage(): FileStorage {
  if (override) return override;
  if (devMemoryEnabled()) return (gs.__devStore ??= new MemoryStorage());
  if (!supabaseConfig()) throw new Error("Storage is not configured");
  return (real ??= new SupabaseStorage());
}
