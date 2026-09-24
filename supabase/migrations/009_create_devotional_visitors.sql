-- Migration: 009_create_devotional_visitors.sql
-- Track signed-in users who visit the devotional each day

CREATE TABLE IF NOT EXISTS public.devotional_visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devotional_date TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT NOT NULL DEFAULT '',
  visited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(devotional_date, user_id)
);

CREATE INDEX IF NOT EXISTS idx_devotional_visitors_date
  ON public.devotional_visitors(devotional_date, visited_at DESC);

ALTER TABLE public.devotional_visitors ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'devotional_visitors' AND policyname = 'Allow public read visitors') THEN
    CREATE POLICY "Allow public read visitors" ON public.devotional_visitors FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'devotional_visitors' AND policyname = 'Allow public insert visitors') THEN
    CREATE POLICY "Allow public insert visitors" ON public.devotional_visitors FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'devotional_visitors' AND policyname = 'Allow public upsert visitors') THEN
    CREATE POLICY "Allow public upsert visitors" ON public.devotional_visitors FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

GRANT ALL ON public.devotional_visitors TO anon, authenticated, service_role;
