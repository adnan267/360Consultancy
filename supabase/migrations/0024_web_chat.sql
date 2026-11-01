-- Website chat: visitors talk to the team without an account. Server-side access only (service role).
create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  visitor_name text not null,
  visitor_contact text,
  status text not null default 'open' check (status in ('open','closed')),
  unread_admin boolean not null default true,
  landing text,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  sender text not null check (sender in ('visitor','team')),
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_thread_idx on public.chat_messages (thread_id, created_at);
create index if not exists chat_threads_last_idx on public.chat_threads (last_message_at desc);
alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;
