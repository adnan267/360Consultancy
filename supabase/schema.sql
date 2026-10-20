-- Run in Supabase SQL Editor. The service-role key is server-only.
create extension if not exists pgcrypto;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer_name text not null check (char_length(customer_name) between 2 and 100),
  customer_email text not null check (char_length(customer_email) <= 254),
  customer_phone text not null check (char_length(customer_phone) between 7 and 30),
  service text not null check (service in ('consultation','document_review','application_assistance')),
  country text not null check (char_length(country) between 2 and 80),
  message text not null default '' check (char_length(message) <= 1000),
  amount_pkr integer not null check (amount_pkr > 0),
  payment_method text not null default 'bank_transfer' check (payment_method in ('bank_transfer')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','proof_submitted','verified','rejected','refunded')),
  booking_status text not null default 'new' check (booking_status in ('new','awaiting_payment','payment_review','confirmed','completed','cancelled'))
);

create index if not exists bookings_created_at_idx on public.bookings(created_at desc);
create index if not exists bookings_status_idx on public.bookings(booking_status, payment_status);

alter table public.bookings enable row level security;
-- No anon/authenticated policies by design. Public booking inserts use server-side route only.
-- Admin reads/updates use the server-only service role after signed admin-session validation.
revoke all on public.bookings from anon, authenticated;
grant all on public.bookings to service_role;