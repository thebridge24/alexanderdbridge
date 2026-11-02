-- Monthly devotional themes. A month with no row uses the latest theme set before it,
-- so a new theme only needs a row when it changes.
CREATE TABLE IF NOT EXISTS public.monthly_themes (
    month_key TEXT PRIMARY KEY,          -- 'YYYY-MM'
    title TEXT NOT NULL,
    scripture TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.monthly_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access on monthly_themes"
ON public.monthly_themes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Current theme, carried forward to later months until a new row is added
INSERT INTO public.monthly_themes (month_key, title)
VALUES ('2026-10', 'Abiding In Him')
ON CONFLICT (month_key) DO NOTHING;
