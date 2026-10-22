-- Keep every Paystack attempt separately from the current subscription state.
-- This lets admins see successful, pending, failed, and cancelled payments.
create table if not exists public.support_payment_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  user_email text,
  plan_type text not null check (plan_type in ('reader', 'supporter', 'sponsor', 'patron')),
  billing_cycle text not null check (billing_cycle in ('monthly', 'yearly')),
  amount integer not null default 0,
  paystack_reference text not null unique,
  paystack_channel text,
  status text not null default 'pending'
    check (status in ('pending', 'success', 'cancelled', 'failed')),
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_payment_transactions_status_idx
  on public.support_payment_transactions (status);
create index if not exists support_payment_transactions_email_idx
  on public.support_payment_transactions (user_email);
create index if not exists support_payment_transactions_created_at_idx
  on public.support_payment_transactions (created_at desc);

alter table public.support_payment_transactions enable row level security;

-- The service-role Supabase client used by server routes bypasses RLS.
-- No public read/write policy is intentionally granted for payment records.
