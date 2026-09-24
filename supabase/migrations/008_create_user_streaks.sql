-- Migration: 008_create_user_streaks.sql
-- Store user streak metrics, attendance history, unlocked milestone badges, and completed devotionals

CREATE TABLE IF NOT EXISTS public.user_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  last_visit_date TEXT NOT NULL DEFAULT '',
  unlocked_medal_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  attendance_history JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed_devotionals JSONB NOT NULL DEFAULT '[]'::jsonb,
  display_name TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON public.user_streaks(user_id);

-- Enable Row Level Security
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- Idempotent RLS Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_streaks' AND policyname = 'Users can view their own streak') THEN
    CREATE POLICY "Users can view their own streak" ON public.user_streaks
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_streaks' AND policyname = 'Users can insert their own streak') THEN
    CREATE POLICY "Users can insert their own streak" ON public.user_streaks
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_streaks' AND policyname = 'Users can update their own streak') THEN
    CREATE POLICY "Users can update their own streak" ON public.user_streaks
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_streaks' AND policyname = 'Allow public read user_streaks') THEN
    CREATE POLICY "Allow public read user_streaks" ON public.user_streaks
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_streaks' AND policyname = 'Allow public upsert user_streaks') THEN
    CREATE POLICY "Allow public upsert user_streaks" ON public.user_streaks
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Grant permissions to anon, authenticated, and service_role
GRANT ALL ON public.user_streaks TO anon, authenticated, service_role;

-- Automatic user streak row creation trigger on Google OAuth / auth.users signup
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

  RETURN NEW;
END;
$$;

-- Trigger to automatically invoke handle_new_user on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill any existing users in auth.users that don't have a record yet
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
SELECT
  id,
  COALESCE(
    raw_user_meta_data->>'full_name',
    raw_user_meta_data->>'name',
    split_part(COALESCE(email, 'user'), '@', 1)
  ),
  COALESCE(
    raw_user_meta_data->>'avatar_url',
    raw_user_meta_data->>'picture',
    ''
  ),
  0,
  0,
  '',
  '[]'::jsonb,
  '{}'::jsonb,
  '[]'::jsonb
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
