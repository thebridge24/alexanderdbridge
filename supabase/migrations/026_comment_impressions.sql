-- One row per viewer per comment or reply, so impressions count unique views
CREATE TABLE IF NOT EXISTS public.devotional_comment_impressions (
    target_type TEXT NOT NULL CHECK (target_type IN ('comment', 'reply')),
    target_id UUID NOT NULL,
    viewer_key TEXT NOT NULL,              -- 'user:<id>' or 'session:<id>'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (target_type, target_id, viewer_key)
);

ALTER TABLE public.devotional_comment_impressions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access on devotional_comment_impressions"
ON public.devotional_comment_impressions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_comment_impressions_target
ON public.devotional_comment_impressions (target_id);
