# 360 Consultancy — 360consultancy.pk

Next.js (App Router, TypeScript strict) + Supabase PostgreSQL, deployed on Vercel.
Public visa-guidance site, booking-request workflow, manual bank-transfer payment verification, and a role-based admin dashboard.

> **Paid bookings are OFF by default** (`SERVICES_ENABLED=false`, enforced server-side). Saving wizard leads is a separate flag, `LEADS_ENABLED=false` by default. Read `docs/LAUNCH_CHECKLIST.md` before enabling.

## Local development
```bash
cp .env.example .env.local        # fill in values (see comments inside)
npm install
npm run dev                        # http://localhost:3000
```
Without Supabase credentials the marketing site still renders (from built-in seed data); booking and admin need the database.

## Commands
| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm test` | Vitest unit + integration tests |
| `npm run build` | Production build |
| `npm run check:bundle` | After build: fail if secrets/server modules appear in client JS |
| `npm run gen:seed` | Regenerate `supabase/migrations/0002_seed.sql` from `src/data/seed.ts` |
| `npm run create-admin -- you@example.com admin` | Create/reset an admin (prompts for password) |

## Database (Supabase)
1. Create a Supabase project (separate projects for **production** and **preview/staging**).
2. Run `supabase/migrations/0001_init.sql`, `0002_seed.sql`, `0003_leads_scholarships.sql`, `0004_seed_scholarships.sql`, `0005_payment_events.sql` in order in the SQL editor (or `supabase db push`).
3. Copy the project URL and **service_role** key into server-only env vars. Never prefix with `NEXT_PUBLIC_`.
4. `SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… npm run create-admin -- you@example.com admin`

RLS is enabled on every table; only active `services`/`countries` are anon-readable. All private data is accessed server-side with the service-role key.

## Where things live
- `src/lib/bookings.ts` — booking creation + admin state machine (pricing, payment verification, audit)
- `src/lib/status.ts` — allowed transitions and role permissions
- `src/lib/auth.ts`, `security.ts` — sessions, origin/CSRF check, body limits
- `src/lib/repo/*` — persistence (Supabase + in-memory test repo)
- `src/lib/email.ts` — provider abstraction (disabled until credentials exist)
- `src/data/seed.ts` — proposed services/fees (DB is the source of truth for prices)
- `src/data/countries.ts` — country page content + official links (edit here; set `lastVerified` after checking sources)
- `docs/` — deployment, operations, launch checklist, homepage design reference


## Public tools (Tranche 1)
`/wizard` (visa-options wizard, not an eligibility decision), `/scholarships` (verified records only), `/tools/document-checklist`, `/compare`, 7 country pages. Country facts and scholarships are published only with an official source URL and a verified date (see `src/data/`).

## Payments, receipts, reports
- Payments are **manual bank transfer**. A provider-agnostic adapter + signed, idempotent webhook (`/api/webhooks/payments`, migration `0005`) exist but **no provider is implemented**: the route returns 404 until an adapter is added in `src/lib/payments/provider.ts` and `PAYMENT_PROVIDER` names it. Verified provider payments only move a payment to *under review*; an admin still verifies. Tested with a mock provider only, never against a real one.
- Admin: printable receipt for verified payments, and `/admin/reports` (admin-only).

## Client portal & staged payments (`PORTAL_ENABLED`, off by default)
Needs `PORTAL_ENABLED=true` **and** `SERVICES_ENABLED=true`, migration `0006_portal_cases.sql` (tables + private `case-documents` bucket), and the service-role key.
Flow: client registers → opens a case → **pays the starting fee** (visa-guidance-session fee) → **uploads documents** → **pays the review fee** (document-review fee) → staff review each document, may send back for fixes (no second review fee), then publish a review report and a **submission quote** → client accepts → **pays the submission fee** (= the quote) → staff submit the file and record the authority's reference.
- Every payment is bank transfer; a stage unlocks only when an **admin verifies the bank record and the exact amount** (staff cannot verify, reject or refund).
- Fees for stages 1–2 come from the `services` table; stage 3 is the staff quote. Nothing is taken from the browser.
- Uploads: PDF/JPG/PNG only (checked by file bytes), 4 MB each, 20 per case, private storage, served only via authenticated routes as attachments; staff downloads are audit-logged.
- Admin: `/admin/cases` (list, filters), case page (verify payments, review documents, report + quote, record submission, cancel/refund), dashboard counters.
- Local UI work without Supabase: `DEV_MEMORY_DB=true npm run dev` (in-memory data, dev admin `dev@example.com` / `dev-password-123`; disabled in production builds).

## Known limitations
- No virus scanning of uploads; no self-service password reset or email verification (needs an email provider); no email notifications for case steps yet (clients see status in the portal, staff must contact them).
- Uploads are limited to 4 MB because they pass through the server (serverless body limit); direct-to-storage signed uploads would allow larger files.
- Status change + audit entry are not in one DB transaction.
- Not verified against a real Supabase project or real storage; verified with in-memory data only.

## Not built yet
Appointment calendar, analytics, a real payment-provider adapter, email notifications for case steps.
