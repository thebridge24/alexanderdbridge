-- Migration 016: Create User Subscriptions & Verification Storage
-- Stores user support tiers (Supporter, Sponsor, Patron) and badge colors

create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade not null,
  user_email text,
  plan_type text not null check (plan_type in ('reader', 'supporter', 'sponsor', 'patron')),
  billing_cycle text not null check (billing_cycle in ('monthly', 'yearly')),
  verification_tier text check (verification_tier in ('supporter', 'sponsor', 'patron', null)),
  badge_color text, -- '#3b82f6' for Supporter, '#8b5cf6' for Sponsor, '#d4a017' for Patron
  status text not null default 'active' check (status in ('active', 'canceled', 'expired', 'paused', 'pending_review')),
  amount integer not null default 0,
  paystack_reference text,
  paystack_channel text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Unique constraint / index per user to allow upserting
create unique index if not exists user_subscriptions_user_id_idx
  on public.user_subscriptions (user_id);

create index if not exists user_subscriptions_tier_idx
  on public.user_subscriptions (verification_tier)
  where status = 'active';

-- Enable RLS
alter table public.user_subscriptions enable row level security;

-- Policy: Users can view their own subscription
create policy "Users can read own subscription"
  on public.user_subscriptions
  for select
  using (auth.uid() = user_id);

-- Policy: Public can view active verified subscriptions for community badges
create policy "Public can read active verified subscriptions"
  on public.user_subscriptions
  for select
  using (status = 'active' and verification_tier is not null);
