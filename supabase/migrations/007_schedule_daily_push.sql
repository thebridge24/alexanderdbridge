-- Schedule the Edge Function every morning at 06:00 UTC.
-- Set DEVOTIONAL_TIMEZONE to the audience timezone in the function secrets.
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'daily-devotional-push-6am',
  '0 6 * * *',
  $$
    select net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/send-daily-devotional',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
      ),
      body := '{}'::jsonb
    );
  $$
)
where not exists (
  select 1 from cron.job where jobname = 'daily-devotional-push-6am'
);
