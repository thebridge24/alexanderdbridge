-- Voice recording for each devotional
CREATE TABLE IF NOT EXISTS public.devotional_audio (
    date_string TEXT PRIMARY KEY,
    audio_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    duration_seconds INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- How many times each user has started a devotional's audio
CREATE TABLE IF NOT EXISTS public.devotional_audio_plays (
    user_id UUID NOT NULL,
    date_string TEXT NOT NULL,
    play_count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, date_string)
);

ALTER TABLE public.devotional_audio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devotional_audio_plays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on devotional_audio"
ON public.devotional_audio FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on devotional_audio_plays"
ON public.devotional_audio_plays FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Public bucket for the recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('devotional-audio', 'devotional-audio', true)
ON CONFLICT (id) DO NOTHING;
