-- Admin-editable ad landing pages (/lp/<slug>). A row overrides the built-in page (or country page)
-- with the same slug; a slug with no built-in page creates a new landing page. Service-role only.
create table if not exists public.landing_pages (
  slug text primary key check (slug ~ '^[a-z0-9-]{1,80}$'),
  purpose text not null check (purpose in ('study', 'work', 'visit', 'unsure')),
  destination text,
  title text not null check (char_length(title) between 3 and 120),
  headline text not null check (char_length(headline) between 3 and 160),
  sub text not null default '' check (char_length(sub) <= 400),
  bullets jsonb not null default '[]'::jsonb check (jsonb_typeof(bullets) = 'array'),
  faqs jsonb not null default '[]'::jsonb check (jsonb_typeof(faqs) = 'array'),
  service_slug text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger landing_pages_updated before update on public.landing_pages for each row execute function public.set_updated_at();

alter table public.landing_pages enable row level security;
revoke all on public.landing_pages from anon, authenticated;
grant all on public.landing_pages to service_role;
