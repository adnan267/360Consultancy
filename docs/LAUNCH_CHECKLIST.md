# Launch checklist — 360consultancy.pk

Keep `SERVICES_ENABLED=false` until **every item in section A** is done.

## A. Legal & business prerequisites (owner action — not verified by this project)
- [ ] Confirm with a qualified Pakistani lawyer/regulator whether the planned services (visa guidance, document review, **application assistance**) trigger licensing/registration: visa consultancy, travel-agency activity, or overseas-employment/emigration-promoter rules (e.g. Bureau of Emigration & Overseas Employment).
- [ ] Business registration (SECP/sole proprietor/etc.), NTN and any tax registration in place.
- [ ] Bank account terms allow receiving these payments; account title matches business name.
- [ ] Privacy Policy, Terms, Refund & Cancellation Policy reviewed and finalised by legal counsel (current pages are **drafts** with `[bracketed]` placeholders).
- [ ] Data-retention period decided (migration default is a 2-year placeholder).
- [ ] Application Assistance stays **inactive** until licensing is confirmed.

## B. Content to supply (nothing was invented)
- [ ] Verified phone, email, WhatsApp, address, social links → env vars (hidden when blank).
- [ ] Registration/licence number → `NEXT_PUBLIC_BUSINESS_REGISTRATION` (only if real).
- [ ] Final fees approved → Admin → Services & pricing, untick "Needs review".
- [ ] Country pages: check each official link, then set `lastVerified` in `src/data/countries.ts`. No fees/processing times are stated until you add verified ones.
- [ ] Real photography (the mockup's stock images were not available); team/About details when verifiable. **No testimonials, client counts or years-of-experience claims are shown** — add only if true and provable.
- [ ] Transparent/vector logo: only the raster logo was supplied. Header uses it on white; the footer places it on a white panel. Supply the source file for a true transparent/SVG version.

## C. Technical
- [ ] Supabase production project + migrations 0001–0016 applied; RLS verified (anon key cannot read `bookings`).
- [ ] `create-admin` run; sign-in tested; strong unique password.
- [ ] `SESSION_SECRET` set (≥32 random chars) in Production.
- [ ] `BANK_*` set; email provider credentials set and a real test email received (provider adapter is untested against the live API).
- [ ] Domain DNS configured with the exact records Vercel shows; HTTPS active.
- [ ] Backup + restore rehearsed (docs/OPERATIONS.md).
- [ ] Full test booking in Preview: request → accept → under review → verify → confirm → cancel → refund.
- [ ] Wizard lead saving: keep `LEADS_ENABLED=false` until the privacy policy is final; then enable and test one lead end to end. Schedule `purge_expired_leads()` per OPERATIONS.md.
- [ ] Set `SERVICES_ENABLED=true` in Production and redeploy.
- [ ] Consider adding Cloudflare Turnstile/hCaptcha if spam appears (honeypot + rate limits only today).
- [ ] Online payments: only after a provider approves the business — write its adapter, test with the provider's sandbox, then set `PAYMENT_PROVIDER`. Until then keep it blank.
- [ ] Client portal: confirm with counsel that handling client documents and *submitting applications on clients' behalf* is permitted for your registration; finalise the Privacy Policy section on uploaded documents and the retention period; confirm the 3 stage fees and the refund rules per stage in the Refund Policy.
- [ ] Portal: on a Supabase **staging** project run the full flow (register → pay → upload → review → quote → submit) with fake data and confirm the `case-documents` bucket is private. Then set `PORTAL_ENABLED=true`.
- [ ] Decide how clients are told about case steps (email provider not configured) and how password resets are handled.
