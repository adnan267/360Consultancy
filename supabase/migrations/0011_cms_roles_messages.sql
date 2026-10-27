-- More admin roles, editable FAQs, blog, case messages (client-visible vs internal notes),
-- data-subject requests, and automatic invoice numbers. All service-role only.

-- ── roles ──
alter table public.admin_users drop constraint if exists admin_users_role_check;
alter table public.admin_users add constraint admin_users_role_check
  check (role in ('admin', 'staff', 'consultant', 'finance', 'support'));

-- ── FAQs ──
create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null check (char_length(question) between 3 and 300),
  answer text not null check (char_length(answer) between 3 and 4000),
  sort_order int not null default 100,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger faqs_updated before update on public.faqs for each row execute function public.set_updated_at();

-- ── blog ──
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{1,80}$'),
  title text not null check (char_length(title) between 3 and 160),
  excerpt text not null default '' check (char_length(excerpt) <= 300),
  body text not null default '' check (char_length(body) <= 60000),
  meta_title text check (meta_title is null or char_length(meta_title) <= 70),
  meta_description text check (meta_description is null or char_length(meta_description) <= 200),
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger blog_posts_updated before update on public.blog_posts for each row execute function public.set_updated_at();

-- ── case messages: internal=true is a staff-only note, never shown to the client ──
create table if not exists public.case_messages (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  sender text not null check (sender in ('client', 'staff')),
  sender_label text not null,
  body text not null check (char_length(body) between 1 and 2000),
  internal boolean not null default false,
  created_at timestamptz not null default now(),
  constraint internal_only_from_staff check (not internal or sender = 'staff')
);
create index if not exists case_messages_case_idx on public.case_messages (case_id, created_at);

-- ── data-subject requests (export / delete) ──
create table if not exists public.data_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  kind text not null check (kind in ('export', 'delete')),
  status text not null default 'open' check (status in ('open', 'done', 'rejected')),
  note text check (note is null or char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  handled_at timestamptz
);
create index if not exists data_requests_status_idx on public.data_requests (status, created_at);

-- ── invoice numbers: assigned automatically when a payment becomes verified ──
create sequence if not exists public.invoice_seq;
alter table public.case_payments add column if not exists invoice_no text unique;
alter table public.payments add column if not exists invoice_no text unique;
create or replace function public.assign_invoice_no() returns trigger language plpgsql as $$
begin
  if new.status = 'verified' and new.invoice_no is null then
    new.invoice_no := 'INV-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.invoice_seq')::text, 6, '0');
  end if;
  return new;
end $$;
drop trigger if exists case_payments_invoice on public.case_payments;
create trigger case_payments_invoice before insert or update on public.case_payments for each row execute function public.assign_invoice_no();
drop trigger if exists payments_invoice on public.payments;
create trigger payments_invoice before insert or update on public.payments for each row execute function public.assign_invoice_no();
update public.case_payments set status = status where status = 'verified' and invoice_no is null;
update public.payments set status = status where status = 'verified' and invoice_no is null;

do $$ declare t text; begin
  foreach t in array array['faqs','blog_posts','case_messages','data_requests'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;
grant usage, select on sequence public.invoice_seq to service_role;
