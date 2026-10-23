-- Wizard leads + scholarship finder.

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  email text not null check (char_length(email) <= 254),
  phone text check (phone is null or char_length(phone) between 7 and 20),
  purpose text not null check (purpose in ('study', 'work', 'visit', 'unsure')),
  destination text not null check (char_length(destination) <= 60),
  answers jsonb not null default '{}'::jsonb,
  suggested_services text[] not null default '{}',
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  consent_privacy_at timestamptz not null default now(),
  -- Placeholder retention (2 years) pending legal confirmation.
  delete_after date not null default (current_date + interval '2 years'),
  created_at timestamptz not null default now()
);
create index leads_created_idx on public.leads (created_at desc);
create index leads_status_idx on public.leads (status);
create index leads_email_idx on public.leads (lower(email));

create table public.scholarships (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{1,120}$'),
  name text not null,
  country_slug text not null,
  provider text not null,
  degree_levels text[] not null default '{}',
  funding_type text not null check (funding_type in ('full', 'partial', 'other', 'not_stated')),
  funding_details text not null default '',
  deadline date,
  deadline_note text not null default '',
  eligibility_summary text not null,
  official_url text not null check (official_url ~ '^https://'),
  last_verified date,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A published record must carry the date its official source was verified.
  constraint published_requires_verification check (not is_published or last_verified is not null)
);
create index scholarships_country_idx on public.scholarships (country_slug);
create index scholarships_published_idx on public.scholarships (is_published);
create trigger scholarships_updated before update on public.scholarships
  for each row execute function public.set_updated_at();

alter table public.leads enable row level security;
alter table public.scholarships enable row level security;

-- Public may read published scholarships only; leads are service-role only.
create policy "public can read published scholarships" on public.scholarships
  for select to anon, authenticated using (is_published);

revoke all on public.leads, public.scholarships from anon, authenticated;
grant select on public.scholarships to anon, authenticated;
grant all on public.leads, public.scholarships to service_role;

-- Retention: also purge expired leads.
create or replace function public.purge_expired_leads() returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  delete from public.leads where delete_after < current_date;
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.purge_expired_leads() from public, anon, authenticated;
grant execute on function public.purge_expired_leads() to service_role;
