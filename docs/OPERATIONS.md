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
