-- Store one Firebase Cloud Messaging token per authenticated user and browser.
create table if not exists public.push_notification_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  platform text not null default 'web' check (platform = 'web'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_notification_tokens_user_id_idx
  on public.push_notification_tokens(user_id);

alter table public.push_notification_tokens enable row level security;

revoke all on public.push_notification_tokens from anon, authenticated;
grant select, insert, update, delete on public.push_notification_tokens to service_role;
