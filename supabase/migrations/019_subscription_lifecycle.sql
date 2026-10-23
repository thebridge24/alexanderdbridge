-- Migration 019: subscription periods, renewal reminders and 3-day grace period.
--  * Adds start/expiry dates and bookkeeping so reminders (7,5,3,2,1 days left) are sent once each.
--  * Allows the "partner" plan/tier that the app already offers.
--  * Schedules the daily lifecycle job (the 5-minute dispatcher also runs it; it is idempotent).

alter table public.user_subscriptions
  add column if not exists started_at timestamptz,
  add column if not exists expires_at timestamptz,
  add column if not exists is_complimentary boolean not null default false,
  add column if not exists payment_method text,
  add column if not exists user_name text,
  add column if not exists reminders_sent integer[] not null default '{}',
  add column if not exists grace_notified boolean not null default false,
  add column if not exists expired_notified boolean not null default false;

-- Allow the partner plan and tier
alter table public.user_subscriptions drop constraint if exists user_subscriptions_plan_type_check;
alter table public.user_subscriptions
  add constraint user_subscriptions_plan_type_check
  check (plan_type in ('reader', 'supporter', 'sponsor', 'partner', 'patron'));

alter table public.user_subscriptions drop constraint if exists user_subscriptions_verification_tier_check;
alter table public.user_subscriptions
  add constraint user_subscriptions_verification_tier_check
  check (verification_tier is null or verification_tier in ('supporter', 'sponsor', 'partner', 'patron'));

-- Existing active subscribers have no expiry yet. Start their clock from now (one full billing
-- period) so nobody is downgraded the moment this runs.
update public.user_subscriptions
set started_at = coalesce(started_at, created_at),
    expires_at = case when billing_cycle = 'yearly' then now() + interval '1 year'
                      else now() + interval '1 month' end
where expires_at is null and status = 'active';

create index if not exists user_subscriptions_expires_at_idx
  on public.user_subscriptions (expires_at)
  where status = 'active';

-- Daily lifecycle job (same site_url / cron_secret settings as the notification dispatcher)
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'subscription-lifecycle-daily',
  '0 8 * * *',
  $$
    select net.http_post(
      url := current_setting('app.settings.site_url', true) || '/api/cron/subscriptions',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret', true)
      ),
      body := '{}'::jsonb
    );
  $$
)
where not exists (select 1 from cron.job where jobname = 'subscription-lifecycle-daily');
