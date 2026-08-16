-- Migration to create the devotionals table for admin additions
CREATE TABLE IF NOT EXISTS devotionals (
  date_string TEXT PRIMARY KEY,
  day_number INTEGER NOT NULL,
  display_date TEXT NOT NULL,
  topic TEXT NOT NULL,
  text TEXT NOT NULL,
  memory_verse JSONB NOT NULL,
  explanation TEXT NOT NULL,
  needed_steps TEXT[] NOT NULL,
  prayer_points TEXT[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE devotionals ENABLE ROW LEVEL SECURITY;

-- Allow public read access to devotionals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'devotionals' AND policyname = 'Allow public read access to devotionals'
  ) THEN
    CREATE POLICY "Allow public read access to devotionals"
      ON devotionals FOR SELECT
      USING (true);
  END IF;
END $$;
