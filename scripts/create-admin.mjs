#!/usr/bin/env node
// Creates (or resets the password of) an admin user.
// Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/create-admin.mjs <email> [admin|staff]
// The password is read from the prompt (not from argv, so it never lands in shell history).
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import { createInterface } from "node:readline";

const [email, role = "admin"] = process.argv.slice(2);
if (!email || !["admin", "staff"].includes(role)) {
  console.error("Usage: node scripts/create-admin.mjs <email> [admin|staff]");
  process.exit(1);
}
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.");
  process.exit(1);
}

const rl = createInterface({ input: process.stdin, output: process.stdout });
const password = await new Promise((r) => rl.question("Password (min 12 chars; input is visible): ", r));
rl.close();
if (password.length < 12) {
  console.error("Password must be at least 12 characters.");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const password_hash = await bcrypt.hash(password, 12);
const { error } = await db.from("admin_users").upsert({ email: email.toLowerCase(), password_hash, role, is_active: true }, { onConflict: "email" });
if (error) {
  // The unique index is on lower(email); fall back to insert/update manually.
  const { data: existing } = await db.from("admin_users").select("id").ilike("email", email).maybeSingle();
  const res = existing
    ? await db.from("admin_users").update({ password_hash, role, is_active: true }).eq("id", existing.id)
    : await db.from("admin_users").insert({ email: email.toLowerCase(), password_hash, role });
  if (res.error) { console.error("Failed:", res.error.message); process.exit(1); }
}
console.log(`Admin user ${email} (${role}) saved.`);
