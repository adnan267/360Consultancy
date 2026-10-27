-- Final deliverables, handover, and the official visa decision (kept separate from consultancy completion).
alter table public.cases drop constraint if exists cases_status_check;
alter table public.cases add constraint cases_status_check check (status in (
  'awaiting_intake_payment','documents_open','awaiting_review_payment','in_review','review_complete',
  'awaiting_submission_payment','submission_in_progress','submitted','completed','cancelled'));

alter table public.cases
  add column if not exists handover_at timestamptz,
  add column if not exists handover_notes text,
  add column if not exists decision text check (decision is null or decision in ('approved','refused','withdrawn')),
  add column if not exists decision_at timestamptz,
  add column if not exists decision_note text;

create table if not exists public.case_deliverables (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  original_name text not null check (char_length(original_name) <= 200),
  storage_path text not null unique,
  mime text not null check (mime in ('application/pdf','image/jpeg','image/png')),
  size_bytes int not null check (size_bytes > 0 and size_bytes <= 4194304),
  uploaded_by uuid references public.admin_users (id),
  uploaded_at timestamptz not null default now()
);
create index if not exists case_deliverables_case_idx on public.case_deliverables (case_id);
alter table public.case_deliverables enable row level security;
revoke all on public.case_deliverables from anon, authenticated;
grant all on public.case_deliverables to service_role;
