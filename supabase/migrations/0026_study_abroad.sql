-- Study abroad module: destinations, universities, detailed scholarships.
-- Only officially confirmed facts are filled in; everything else is blank and editable from Admin -> Study Abroad.

alter table public.scholarships drop constraint if exists scholarships_funding_type_check;
alter table public.scholarships add constraint scholarships_funding_type_check check (funding_type in ('full','tuition_free','partial','other','not_stated'));
alter table public.scholarships drop constraint if exists published_requires_verification;
alter table public.scholarships
  add column if not exists eligible_nationalities text not null default '',
  add column if not exists disciplines text not null default '',
  add column if not exists tuition_coverage text not null default '',
  add column if not exists stipend text not null default '',
  add column if not exists accommodation text not null default '',
  add column if not exists airfare text not null default '',
  add column if not exists insurance text not null default '',
  add column if not exists min_qualification text not null default '',
  add column if not exists age_requirement text not null default '',
  add column if not exists language_requirement text not null default '',
  add column if not exists required_documents text[] not null default '{}',
  add column if not exists opens_note text not null default '',
  add column if not exists duration text not null default '',
  add column if not exists sort_order int not null default 100;

create table if not exists public.study_destinations (
  slug text primary key check (slug ~ '^[a-z0-9-]{2,60}$'),
  name text not null,
  flag text check (flag is null or flag ~ '^[a-z]{2}$'),
  region text not null default 'Europe',
  overview text not null default '',
  degree_programs text not null default '',
  tuition_info text not null default '',
  living_cost text not null default '',
  language_requirements text not null default '',
  english_tests text not null default '',
  admission_requirements text not null default '',
  visa_requirements text not null default '',
  work_options text not null default '',
  official_links jsonb not null default '[]'::jsonb,
  last_verified date,
  is_published boolean not null default true,
  sort_order int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.universities (
  slug text primary key check (slug ~ '^[a-z0-9-]{2,100}$'),
  name text not null,
  country_slug text not null,
  city text not null default '',
  logo_url text check (logo_url is null or logo_url ~ '^https://'),
  overview text not null default '',
  official_url text not null default '' check (official_url = '' or official_url ~ '^https://'),
  ranking text not null default '',
  ranking_source text not null default '',
  ranking_year int check (ranking_year is null or ranking_year between 1990 and 2100),
  degree_levels text[] not null default '{}',
  programs text[] not null default '{}',
  tuition_range text not null default '',
  admission_requirements text not null default '',
  english_requirements text not null default '',
  scholarships_note text not null default '',
  scholarship_coverage text not null default '',
  tuition_free_note text not null default '',
  apply_opens text not null default '',
  apply_closes text not null default '',
  admission_portal_url text check (admission_portal_url is null or admission_portal_url ~ '^https://'),
  last_verified date,
  is_published boolean not null default true,
  sort_order int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists universities_country_idx on public.universities (country_slug, sort_order);
create trigger study_destinations_updated before update on public.study_destinations for each row execute function public.set_updated_at();
create trigger universities_updated before update on public.universities for each row execute function public.set_updated_at();

alter table public.study_destinations enable row level security;
alter table public.universities enable row level security;
create policy "public can read published destinations" on public.study_destinations for select to anon, authenticated using (is_published);
create policy "public can read published universities" on public.universities for select to anon, authenticated using (is_published);
revoke all on public.study_destinations, public.universities from anon, authenticated;
grant select on public.study_destinations, public.universities to anon, authenticated;
grant all on public.study_destinations, public.universities to service_role;

