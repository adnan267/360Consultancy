-- 360 Consultancy — initial schema
-- Private customer data is reachable ONLY through the server using the
-- service-role key. RLS is enabled on every table and no anonymous policy
-- exists on private tables.

create extension if not exists pgcrypto;

-- ── helpers ──────────────────────────────────────────────────
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ── services ─────────────────────────────────────────────────
create table public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{1,60}$'),
  title text not null,
  summary text not null,
  description text not null,
  scope text not null,
  inclusions text[] not null default '{}',
  exclusions text[] not null default '{}',
  duration_minutes int check (duration_minutes is null or duration_minutes > 0),
  fee_pkr int not null check (fee_pkr >= 0),
  fee_is_starting_price boolean not null default false,
  fee_needs_review boolean not null default true,
  is_active boolean not null default false,
  refund_terms text not null default '',
  sort_order int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger services_updated before update on public.services
  for each row execute function public.set_updated_at();

-- ── countries ────────────────────────────────────────────────
create table public.countries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{1,60}$'),
  name text not null,
  iso_code text not null,
  is_active boolean not null default true,
  sort_order int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger countries_updated before update on public.countries
  for each row execute function public.set_updated_at();

-- ── admin users (own table; passwords stored only as bcrypt hashes) ──
create table public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  password_hash text not null,
  role text not null check (role in ('admin', 'staff')),
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index admin_users_email_key on public.admin_users (lower(email));
create trigger admin_users_updated before update on public.admin_users
  for each row execute function public.set_updated_at();

-- ── bookings ─────────────────────────────────────────────────
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique check (reference ~ '^360-[A-HJKMNP-Z2-9]{8}$'),
  full_name text not null check (char_length(full_name) between 2 and 100),
  email text not null check (char_length(email) <= 254),
  phone text not null check (char_length(phone) between 7 and 20),
  country_id uuid not null references public.countries (id),
  service_id uuid not null references public.services (id),
  preferred_at timestamptz not null,
  message text not null default '' check (char_length(message) <= 1000),
  -- Snapshot of the fee at request time, calculated server-side from services.fee_pkr
  fee_pkr int not null check (fee_pkr >= 0),
  currency text not null default 'PKR' check (currency = 'PKR'),
  status text not null default 'request_received' check (status in (
    'request_received', 'awaiting_payment', 'payment_under_review',
    'confirmed', 'in_progress', 'completed', 'cancelled')),
  consent_privacy_at timestamptz not null,
  consent_terms_at timestamptz not null,
  -- Retention: placeholder of 2 years, to be confirmed by the owner / legal advice.
  delete_after date not null default (current_date + interval '2 years'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index bookings_status_idx on public.bookings (status);
create index bookings_created_idx on public.bookings (created_at desc);
create index bookings_email_idx on public.bookings (lower(email));
create index bookings_country_idx on public.bookings (country_id);
create index bookings_service_idx on public.bookings (service_id);
create trigger bookings_updated before update on public.bookings
  for each row execute function public.set_updated_at();

-- ── payments (manual bank transfer) ──────────────────────────
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  method text not null default 'bank_transfer' check (method = 'bank_transfer'),
  amount_pkr int not null check (amount_pkr >= 0),
  status text not null default 'awaiting' check (status in (
    'awaiting', 'under_review', 'verified', 'rejected', 'refunded')),
  bank_reference text,
  received_amount_pkr int check (received_amount_pkr is null or received_amount_pkr >= 0),
  verified_by uuid references public.admin_users (id),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A payment can never be "verified" without a bank reference, the amount
  -- actually received, and who verified it and when.
  constraint payment_verified_has_evidence check (
    status not in ('verified', 'refunded') or (
      bank_reference is not null and received_amount_pkr is not null
      and verified_by is not null and verified_at is not null)
  )
);
create trigger payments_updated before update on public.payments
  for each row execute function public.set_updated_at();

-- ── audit log (append-only) ──────────────────────────────────
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings (id) on delete set null,
  actor_id uuid,
  actor_label text not null,
  action text not null,
  from_value text,
  to_value text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_booking_idx on public.audit_logs (booking_id, created_at);
create index audit_logs_created_idx on public.audit_logs (created_at desc);

create or replace function public.audit_logs_immutable() returns trigger
language plpgsql as $$
begin
  if tg_op = 'UPDATE' then
    raise exception 'audit_logs is append-only';
  end if;
  -- deletes are only allowed by the retention job when the parent booking is gone
  if tg_op = 'DELETE' and old.booking_id is not null then
    raise exception 'audit_logs is append-only';
  end if;
  return old;
end $$;
create trigger audit_logs_no_update before update or delete on public.audit_logs
  for each row execute function public.audit_logs_immutable();

-- ── site settings ────────────────────────────────────────────
create table public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
create trigger site_settings_updated before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ── rate limiting (works across serverless instances) ────────
create table public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  count int not null default 0
);

create or replace function public.rate_limit_hit(p_key text, p_limit int, p_window_seconds int)
returns boolean
language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  insert into public.rate_limits as r (key, window_start, count)
  values (p_key, now(), 1)
  on conflict (key) do update set
    window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds)
                        then now() else r.window_start end,
    count = case when r.window_start < now() - make_interval(secs => p_window_seconds)
                 then 1 else r.count + 1 end
  returning count into v_count;
  return v_count <= p_limit;
end $$;

-- ── retention job (run manually or via pg_cron; see docs/OPERATIONS.md) ──
create or replace function public.purge_expired_bookings() returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  delete from public.bookings
  where delete_after < current_date and status in ('completed', 'cancelled');
  get diagnostics n = row_count;
  return n;
end $$;

-- ── Row Level Security ───────────────────────────────────────
alter table public.services enable row level security;
alter table public.countries enable row level security;
alter table public.admin_users enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.audit_logs enable row level security;
alter table public.site_settings enable row level security;
alter table public.rate_limits enable row level security;

-- Only the public catalogue is readable without the service role.
create policy "public can read active services" on public.services
  for select to anon, authenticated using (is_active);
create policy "public can read active countries" on public.countries
  for select to anon, authenticated using (is_active);

-- Least privilege: start from nothing, grant only what is needed.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated, public;
grant select on public.services, public.countries to anon, authenticated;
grant all on all tables in schema public to service_role;
grant execute on function public.rate_limit_hit(text, int, int) to service_role;
grant execute on function public.purge_expired_bookings() to service_role;
