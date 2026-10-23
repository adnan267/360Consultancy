-- Idempotency log for verified payment-provider webhooks. Service-role only.
create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  booking_id uuid references public.bookings (id) on delete set null,
  type text not null,
  amount_pkr int not null check (amount_pkr >= 0),
  created_at timestamptz not null default now(),
  unique (provider, event_id)
);
alter table public.payment_events enable row level security;
revoke all on public.payment_events from anon, authenticated;
