# Operations

## Backups & recovery
- Supabase Pro: enable daily backups / Point-in-Time Recovery. Free tier has no PITR — take manual dumps.
- Manual logical backup (weekly at minimum before launch): `pg_dump "$SUPABASE_DB_URL" --no-owner -Fc -f backup-$(date +%F).dump` (connection string from Supabase → Settings → Database). Store encrypted, off-site.
- Restore into a **new** project first to rehearse: `pg_restore --no-owner -d "$NEW_DB_URL" backup.dump`. Then re-run grants from `0001_init.sql` if needed. Rehearse once before launch.
- Backups contain customer personal data: encrypt and restrict access.

## Data retention
`bookings.delete_after` defaults to 2 years (**placeholder — confirm with legal advice**). Purge completed/cancelled bookings past that date:
`select public.purge_expired_bookings();` — run manually, or schedule with pg_cron (`select cron.schedule('purge-bookings','0 3 * * 0','select public.purge_expired_bookings()');`).
Audit rows are append-only; rows tied to a deleted booking keep no customer PII (notes are the only free text — avoid personal data in notes).

## Admin users
Create/reset: `npm run create-admin -- email role`. Roles: `admin` (everything) and `staff` (view, notes, non-payment status changes). Deactivate by setting `admin_users.is_active=false`. Sessions last 8 hours; rotating `SESSION_SECRET` signs everyone out.

## Payment verification procedure
1. Customer says they paid → set payment **under review** (optional: record the reference they quote).
2. Admin checks the **actual bank account record**. A screenshot alone is never sufficient.
3. Enter the bank transaction reference and the amount actually received; amount must equal the amount due. Verify.
4. Set the booking **Confirmed**. Every step is in the audit history.

## Known limitations
- Status change + audit insert are separate statements (not one DB transaction). A failure between them could leave a state change without its audit row; move to a SQL function for atomicity.
- No automatic data-subject export/deletion tooling; do these manually in SQL.

## Leads and scholarships
- Leads (`/admin/leads`) are retained per the migration default; run `select purge_expired_leads();` on a schedule (Supabase cron) once the retention period is decided.
- Re-verify each scholarship and country fact against its official page before changing `last_verified`; records without verification cannot be published (DB constraint).

## Cases and documents
- Run `select purge_expired_cases();` on a schedule once retention is decided (`cases.delete_after` is a 2-year placeholder). Also delete the matching files from the `case-documents` bucket — the SQL function removes rows only.
- Reset a client's password manually: update `clients.password_hash` with a bcrypt hash (cost 12) generated locally.
- Document downloads by staff appear in the case timeline (`document_downloaded`).

## Accounts, roles and email (migrations 0008–0011)
- Roles: admin, staff, consultant, finance, support (least privilege; only admin manages content/team/settings). Add team with `npm run create-admin -- email role`.
- Client email verification and password reset need a working email provider (`EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, verified sender domain). Until then verification is NOT enforced and reset shows "contact us".
- Optional: `NEXT_PUBLIC_GA_ID` (loads only after cookie consent), `NEXT_PUBLIC_GSC_VERIFICATION`.
- Editable in admin: SEO settings, FAQs, blog, team, data requests (export/delete), case messages (internal notes are staff-only).
- Invoice numbers (INV-YYYY-NNNNNN) are assigned by DB trigger when a payment is verified.

## Known limitations
- Uploads are checked by size/type/magic bytes but not virus-scanned.
- No online payment gateway; payments are bank transfer verified by staff.
- Images are a manifest only (docs/ASSETS.md).

## NOWPayments (migration 0012)
1. In the NOWPayments dashboard create an API key and an IPN secret; set the IPN callback to `https://360consultancy.pk/api/webhooks/nowpayments` and add your USDT (TRC20) payout wallet.
2. Set in Vercel: `NOWPAYMENTS_API_KEY`, `NOWPAYMENTS_IPN_SECRET`, optionally `NOWPAYMENTS_PRICE_CURRENCY` (`pkr`, or `usd` + `PKR_PER_USD`) and `NOWPAYMENTS_PAY_CURRENCY` (default empty = client chooses the coin). Redeploy.
3. Clients then see "Pay online" instead of bank details. Status `finished` + matching invoice id, amount and currency verifies the payment automatically (audit actor `provider:nowpayments`); anything else is left for manual review and emailed to admins.
4. Test with a small real payment first (or NOWPayments sandbox via `NOWPAYMENTS_API_BASE=https://api-sandbox.nowpayments.io`).
Scope: portal case payments. Consultation bookings still use the manual flow.

## Handover, questions, templates, notifications (migrations 0014–0016)
- **Handover**: on a case in "Review complete"/"Submitted", staff upload final files (PDF/images), then use *Complete case*. This is consultancy completion only; the **official visa decision** is recorded separately (needs a recorded submission and a source note) and never changes the consultancy status.
- **Payment terms**: before any online payment the client sees a proposal summary and must tick the terms box; the server refuses without it and the acceptance (terms version, amount) is written to the audit log. Bump `PAYMENT_TERMS_VERSION` in `src/lib/cases.ts` when terms change.
- **Admin → Wizard questions**: extra questions on the public wizard (text / choose one / yes-no, optionally per purpose). Answers show on each lead.
- **Admin → Email templates**: edit client emails (placeholders `{{name}} {{reference}} {{status}} {{link}}`). Emails send only when an email provider is enabled.
- **Notifications**: every status change, confirmed payment, handover and staff message also appears in the client's portal notification centre.
- New services from migration 0014 are inactive with fee 0; activate them under Services & pricing after setting real fees.
