# Deployment (Vercel)

## 1. Project
1. Push the repo to GitHub/GitLab/Bitbucket. Import it in Vercel (framework: Next.js, defaults).
2. Build command `npm run build`; no output directory override.

## 2. Environments
Use **separate** values for Production and Preview (Vercel → Settings → Environment Variables):
- Preview → a staging Supabase project, `SERVICES_ENABLED=false` (or `true` only for testing with fake data), `NEXT_PUBLIC_SITE_URL` = preview URL.
- Production → production Supabase project, real values.

Required: `NEXT_PUBLIC_SITE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET` (`openssl rand -base64 48`), `SERVICES_ENABLED`.
Optional/when verified: contact details, `BANK_*`, `EMAIL_*`/`RESEND_API_KEY`. See `.env.example`.
Changing an env var needs a **redeploy** to take effect.

## 3. Domain (360consultancy.pk)
1. Vercel → Project → Settings → Domains → add `360consultancy.pk` (and `www.360consultancy.pk`).
2. Vercel then **displays the exact DNS records** it needs. Create exactly those at your .pk registrar / DNS host. Do not copy records from elsewhere or guess them.
3. Pick one canonical host (apex or www) and let Vercel redirect the other. Set `NEXT_PUBLIC_SITE_URL` to the canonical origin (it also drives the CSRF origin check, canonical URLs and the sitemap).
4. Wait for DNS propagation and the automatic HTTPS certificate.

## 4. Post-deploy verification
- `npm run build && npm run check:bundle` passes in CI.
- Visit `/`, `/services`, `/countries/canada`, `/book` (should show "not open" while the flag is off).
- `/admin` redirects to `/admin/login`; sign in with the admin created by `create-admin`.
- `curl -I https://360consultancy.pk` shows the security headers.
- Submit a **test booking in Preview** end to end before ever enabling Production.
