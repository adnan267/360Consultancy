-- Admin-editable site settings (SEO meta, email sender, notification recipients). Service-role only.
create table if not exists public.site_settings (
  key text primary key check (char_length(key) between 1 and 64),
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text
);
alter table public.site_settings enable row level security;
revoke all on public.site_settings from anon, authenticated;
grant all on public.site_settings to service_role;
