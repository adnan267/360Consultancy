# 360Consultancy.pk — MVP starter

This is a deployable **starter scaffold**, not a legally approved visa consultancy business and not yet a complete production checkout. It includes a Next.js marketing homepage, Supabase booking schema, a server-side booking API, admin login/session and booking status dashboard. The public booking form remains intentionally disabled until legal and operational checks are complete.

## Stack
- Next.js App Router + TypeScript
- Supabase Postgres
- Vercel deployment
- Bank transfer with manual verification (no fake payment confirmation)

## 1. Requirements
Install a current Node.js LTS release, Git, and create accounts/projects at Vercel and Supabase.

## 2. Install
```bash
npm install
cp .env.example .env.local
npm run dev
```
On Windows PowerShell, use `Copy-Item .env.example .env.local`.

Edit `.env.local`. Do not commit it. Generate a long session secret with:
```bash
openssl rand -base64 48
```
If OpenSSL is unavailable, use a password manager to generate a random secret of at least 32 characters.

## 3. Database
1. Create a Supabase project.
2. Open SQL Editor and run `supabase/schema.sql`.
3. In Supabase Project Settings, copy the Project URL and service-role key into `.env.local`.
4. Never expose `SUPABASE_SERVICE_ROLE_KEY` to browser code or prefix it with `NEXT_PUBLIC_`.

## 4. Admin credentials
Set `ADMIN_EMAIL`, `ADMIN_PASSWORD` (long unique random password), and `SESSION_SECRET` in `.env.local`. Admin path is `/admin`. Keep access to Vercel and Supabase limited to trusted operators. For production, add rate limiting/WAF to the login endpoint and enable Vercel deployment protection for previews.

## 5. Bank-transfer workflow
The starter schema stores a booking and marks payment `unpaid`. Admin manually checks the actual bank statement and only then changes `payment_status` to `verified`; never rely on a screenshot alone. This scaffold does not store payment proof uploads. Provide bank details only for a business account you control and only after a service scope/fee is agreed. Add your bank transfer instructions to a secure post-booking confirmation page/email before accepting real bookings.

## 6. Enable bookings only after checks
Default is `SERVICES_ENABLED=false`. Keep it false while developing. Before enabling:
- confirm applicable Pakistan/federal/provincial licensing and authorization requirements with a qualified lawyer/regulator;
- confirm whether the specific service counts as visa consultancy, travel agency activity, or regulated overseas-employment/emigration assistance;
- add real business contact/address, Privacy Policy, Terms, Refund/Cancellation Policy, data-retention schedule and complaint process;
- confirm bank account ownership, tax/business registration and service-provider bank terms;
- configure an approved transactional email provider and notifications;
- test form validation, booking inserts, admin login, status updates, backups and mobile layout;
- review privacy/data-protection and secure document-handling arrangements.

Set `SERVICES_ENABLED=true` in Vercel only after the above. Redeploy after changing environment variables.

## 7. Local development
```bash
npm run dev
```
Visit `http://localhost:3000` and `/admin`. With `SERVICES_ENABLED=false`, the public booking API intentionally returns HTTP 503. The homepage currently shows a pre-launch notice. Build the actual public booking form and post-booking bank instructions before switching this flag on.

## 8. Vercel deployment
```bash
npm install -g vercel
vercel login
vercel
```
Import/link the repository in Vercel, set the environment variables under Project Settings → Environment Variables (Production and Preview separately), then deploy:
```bash
vercel --prod
```
Add `360consultancy.pk` and `www.360consultancy.pk` under Project → Settings → Domains. Follow Vercel's exact DNS records at your registrar. Do not guess DNS values. Set `NEXT_PUBLIC_SITE_URL` to the canonical HTTPS domain and redeploy. Use preview deployments for testing.

## 9. Important limitations before real customers
- The booking form is included but stays hidden behind `SERVICES_ENABLED=false` until you have completed legal and operational checks.
- No automatic email/SMS/WhatsApp notification.
- No customer login/dashboard or file upload.
- No automatic bank reconciliation; admin verifies manually.
- Add server-side rate limiting, CSRF/origin hardening, error monitoring and tested backups before production.
- Ask a qualified professional to review the visa service claims and all legal documents.
- Never claim visa approval, employment, or a permit is guaranteed.
