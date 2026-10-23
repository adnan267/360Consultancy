// Fails if server-only secrets or server-only modules leak into client bundles. Run after `npm run build`.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = ".next/static";
const forbidden = ["SUPABASE_SERVICE_ROLE_KEY", "SESSION_SECRET", "service_role", "BANK_ACCOUNT_NUMBER", "BANK_IBAN", "RESEND_API_KEY", "bcryptjs", "password_hash"];
const hits = [];
let files = 0;
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(js|css|map)$/.test(f)) {
      files++;
      const t = readFileSync(p, "utf8");
      for (const k of forbidden) if (t.includes(k)) hits.push(`${k} in ${p}`);
    }
  }
})(root);
if (hits.length) { console.error("LEAK:\n" + hits.join("\n")); process.exit(1); }
console.log(`OK: scanned ${files} client files, no forbidden strings.`);
