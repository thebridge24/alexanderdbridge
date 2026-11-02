-- Migration 023: add the Visionary plan (and its verified badge tier) to every
-- table that checks these values.
alter table public.user_subscriptions
  drop constraint if exists user_subscriptions_plan_type_check;
alter table public.user_subscriptions
  add constraint user_subscriptions_plan_type_check
  check (plan_type in ('reader', 'supporter', 'sponsor', 'partner', 'patron', 'visionary'));

alter table public.user_subscriptions
  drop constraint if exists user_subscriptions_verification_tier_check;
alter table public.user_subscriptions
  add constraint user_subscriptions_verification_tier_check
  check (verification_tier is null or verification_tier in ('supporter', 'sponsor', 'partner', 'patron', 'visionary'));

alter table public.support_payment_transactions
  drop constraint if exists support_payment_transactions_plan_type_check;
alter table public.support_payment_transactions
  add constraint support_payment_transactions_plan_type_check
  check (plan_type in ('reader', 'supporter', 'sponsor', 'partner', 'patron', 'visionary'));
