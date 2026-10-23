-- Client portal: accounts, cases (3 paid stages), per-stage payments, documents.
-- All tables are service-role only (RLS on, no policies, no grants to anon/authenticated).

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  password_hash text not null,
  full_name text not null,
  phone text,
  is_active boolean not null default true,
  consent_privacy_at timestamptz not null,
  consent_terms_at timestamptz not null,
  last_login_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index clients_email_uidx on public.clients (lower(email));

create table public.cases (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  client_id uuid not null references public.clients (id) on delete cascade,
  country_id uuid not null references public.countries (id),
  purpose text not null check (purpose in ('study', 'work', 'visit', 'other')),
  status text not null default 'awaiting_intake_payment' check (status in (
    'awaiting_intake_payment', 'documents_open', 'awaiting_review_payment', 'in_review',
    'review_complete', 'awaiting_submission_payment', 'submission_in_progress', 'submitted', 'cancelled')),
  -- Set by staff when the review is complete; becomes the stage-3 fee the client must accept.
  submission_quote_pkr int check (submission_quote_pkr is null or submission_quote_pkr > 0),
  review_report text,
  review_completed_at timestamptz,
  submission_reference text,   -- the authority's / portal's reference, entered by staff
  submission_notes text,
  submitted_at timestamptz,
  delete_after date,           -- retention placeholder; owner must decide the period
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint submitted_has_record check (status <> 'submitted' or (submission_reference is not null and submitted_at is not null)),
  constraint quote_before_submission_payment check (
    status not in ('awaiting_submission_payment', 'submission_in_progress', 'submitted') or submission_quote_pkr is not null)
);
create index cases_client_idx on public.cases (client_id);
create index cases_status_idx on public.cases (status, created_at desc);
create trigger cases_updated before update on public.cases for each row execute function public.set_updated_at();

create table public.case_payments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  stage text not null check (stage in ('intake', 'review', 'submission')),
  amount_pkr int not null check (amount_pkr > 0),   -- snapshot taken server-side when the stage opens
  status text not null default 'awaiting' check (status in ('awaiting', 'under_review', 'verified', 'rejected', 'refunded')),
  client_reference text,        -- what the client says they transferred (NOT evidence)
  bank_reference text,          -- entered by an admin from the bank record
  received_amount_pkr int check (received_amount_pkr is null or received_amount_pkr >= 0),
  verified_by uuid references public.admin_users (id),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (case_id, stage),
  constraint case_payment_verified_has_evidence check (
    status not in ('verified', 'refunded') or (
      bank_reference is not null and received_amount_pkr is not null and verified_by is not null and verified_at is not null))
);
create trigger case_payments_updated before update on public.case_payments for each row execute function public.set_updated_at();

create table public.case_documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  doc_type text not null check (doc_type in ('passport', 'photo', 'transcript', 'certificate', 'experience_letter', 'financial', 'language_test', 'admission_letter', 'other')),
  original_name text not null check (char_length(original_name) <= 200),
  storage_path text not null unique,
  mime text not null check (mime in ('application/pdf', 'image/jpeg', 'image/png')),
  size_bytes int not null check (size_bytes > 0 and size_bytes <= 4194304),
  status text not null default 'uploaded' check (status in ('uploaded', 'accepted', 'needs_fix')),
  admin_note text,
  uploaded_at timestamptz not null default now()
);
create index case_documents_case_idx on public.case_documents (case_id);

-- Audit rows may now reference a case (plain column: audit rows must outlive deletions).
alter table public.audit_logs add column if not exists case_id uuid;
create index if not exists audit_logs_case_idx on public.audit_logs (case_id, created_at);

alter table public.clients enable row level security;
alter table public.cases enable row level security;
alter table public.case_payments enable row level security;
alter table public.case_documents enable row level security;
revoke all on public.clients, public.cases, public.case_payments, public.case_documents from anon, authenticated;

-- Private bucket for client documents (service role only; files are served through authenticated API routes).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('case-documents', 'case-documents', false, 4194304, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = false, file_size_limit = 4194304, allowed_mime_types = excluded.allowed_mime_types;

-- Retention helper (call from a scheduled job once the retention period is decided).
create or replace function public.purge_expired_cases() returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  delete from public.cases where delete_after is not null and delete_after < current_date;
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.purge_expired_cases() from public, anon, authenticated;
