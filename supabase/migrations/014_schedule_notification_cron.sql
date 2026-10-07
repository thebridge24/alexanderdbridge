-- Migration: 014_schedule_notification_cron.sql
-- Unschedule the old generic daily 6am push and schedule the 5-minute notification dispatcher.
-- The dispatcher handles individualized morning reminders at each user's chosen time (default 5am),
-- evening streak-at-risk reminders (at 8pm local time), and inactive user win-back notifications.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Remove old monolithic 6am cron job if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-devotional-push-6am') THEN
    PERFORM cron.unschedule('daily-devotional-push-6am');
  END IF;
END $$;

-- Schedule the 5-minute notification dispatcher
SELECT cron.schedule(
  'devotional-notification-dispatcher-5m',
  '*/5 * * * *',
  $$
    SELECT net.http_post(
      url := current_setting('app.settings.site_url', true) || '/api/cron/notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret', true)
      ),
      body := '{}'::jsonb
    );
  $$
)
WHERE NOT EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'devotional-notification-dispatcher-5m'
);
