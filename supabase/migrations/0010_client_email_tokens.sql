-- Client email verification + password reset. Service-role only.
alter table public.clients add column if not exists email_verified_at timestamptz;
-- Accounts created before verification existed are grandfathered as verified.
update public.clients set email_verified_at = coalesce(email_verified_at, created_at) where email_verified_at is null;

create table if not exists public.client_tokens (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  kind text not null check (kind in ('verify', 'reset')),
  token_hash text not null unique,   -- sha256 of the emailed token; the raw token is never stored
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists client_tokens_client_idx on public.client_tokens (client_id, kind);
alter table public.client_tokens enable row level security;
revoke all on public.client_tokens from anon, authenticated;
grant all on public.client_tokens to service_role;
