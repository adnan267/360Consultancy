-- Admin-managed extra wizard questions, editable email templates, client notification centre.
create table if not exists public.wizard_questions (
  id uuid primary key default gen_random_uuid(),
  label text not null check (char_length(label) between 3 and 200),
  help text check (help is null or char_length(help) <= 400),
  kind text not null check (kind in ('text','select','yesno')),
  options jsonb not null default '[]'::jsonb,
  purpose text check (purpose is null or purpose in ('study','work','visit','unsure')),
  required boolean not null default false,
  sort_order int not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.email_templates (
  key text primary key check (key in ('case_status','payment_verified','deliverables_ready','new_message')),
  subject text not null check (char_length(subject) between 3 and 200),
  body text not null check (char_length(body) between 3 and 4000),
  updated_at timestamptz not null default now()
);
create table if not exists public.client_notifications (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  case_id uuid references public.cases(id) on delete cascade,
  title text not null,
  body text not null default '',
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists client_notifications_client_idx on public.client_notifications (client_id, created_at desc);
alter table public.wizard_questions enable row level security;
alter table public.email_templates enable row level security;
alter table public.client_notifications enable row level security;
