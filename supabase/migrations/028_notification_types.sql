-- Allow every notification type the app sends (follow and mention were rejected before)
ALTER TABLE public.notification_events DROP CONSTRAINT IF EXISTS notification_events_type_check;
ALTER TABLE public.notification_events ADD CONSTRAINT notification_events_type_check
  CHECK (type IN ('like', 'reply', 'comment', 'mention', 'follow', 'reminder', 'streak', 'milestone', 'admin'));
