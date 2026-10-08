create table if not exists public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  survey_id text not null,
  user_id uuid references auth.users (id) on delete set null,
  session_id text,
  user_name text,
  user_email text,
  overall_rating smallint,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists survey_responses_survey_id_idx
  on public.survey_responses (survey_id, created_at desc);

-- Only the service role (API routes) touches this table.
alter table public.survey_responses enable row level security;
