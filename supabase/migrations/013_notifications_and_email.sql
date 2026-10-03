-- Migration: 013_notifications_and_email.sql
-- Adds per-user notification preferences, reminder scheduling, welcome email tracking,
-- and deduplication for notifications.

-- 1. Create notification_preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_enabled BOOLEAN NOT NULL DEFAULT true,
  reminder_time TIME NOT NULL DEFAULT '05:00:00',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  likes_enabled BOOLEAN NOT NULL DEFAULT true,
  replies_enabled BOOLEAN NOT NULL DEFAULT true,
  streak_enabled BOOLEAN NOT NULL DEFAULT true,
  last_reminder_date TEXT,
  last_streak_nudge_date TEXT,
  last_winback_at TIMESTAMPTZ,
  welcome_email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id 
  ON public.notification_preferences(user_id);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notification_preferences' AND policyname = 'Users can view their own notification preferences') THEN
    CREATE POLICY "Users can view their own notification preferences" ON public.notification_preferences
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notification_preferences' AND policyname = 'Users can update their own notification preferences') THEN
    CREATE POLICY "Users can update their own notification preferences" ON public.notification_preferences
      FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notification_preferences' AND policyname = 'Users can insert their own notification preferences') THEN
    CREATE POLICY "Users can insert their own notification preferences" ON public.notification_preferences
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notification_preferences' AND policyname = 'Service role full access notification_preferences') THEN
    CREATE POLICY "Service role full access notification_preferences" ON public.notification_preferences
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

GRANT ALL ON public.notification_preferences TO anon, authenticated, service_role;

-- 2. Modify notification_events to support deduplication and new notification types
ALTER TABLE public.notification_events DROP CONSTRAINT IF EXISTS notification_events_type_check;
ALTER TABLE public.notification_events ADD CONSTRAINT notification_events_type_check 
  CHECK (type IN ('like', 'reply', 'comment', 'reminder', 'streak', 'milestone', 'admin'));

ALTER TABLE public.notification_events ADD COLUMN IF NOT EXISTS dedupe_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_events_dedupe_key 
  ON public.notification_events(dedupe_key) WHERE dedupe_key IS NOT NULL;

-- 3. Extend handle_new_user to ensure notification_preferences row is created for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_streaks (
    user_id,
    display_name,
    avatar_url,
    current_streak,
    best_streak,
    last_visit_date,
    unlocked_medal_ids,
    attendance_history,
    completed_devotionals
  )
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(COALESCE(NEW.email, 'user'), '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture',
      ''
    ),
    0,
    0,
    '',
    '[]'::jsonb,
    '{}'::jsonb,
    '[]'::jsonb
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.notification_preferences (
    user_id,
    reminder_enabled,
    reminder_time,
    timezone,
    likes_enabled,
    replies_enabled,
    streak_enabled
  )
  VALUES (
    NEW.id,
    true,
    '05:00:00',
    'UTC',
    true,
    true,
    true
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 4. Backfill notification_preferences for existing users
INSERT INTO public.notification_preferences (
  user_id,
  reminder_enabled,
  reminder_time,
  timezone,
  likes_enabled,
  replies_enabled,
  streak_enabled
)
SELECT
  id,
  true,
  '05:00:00',
  'UTC',
  true,
  true,
  true
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
