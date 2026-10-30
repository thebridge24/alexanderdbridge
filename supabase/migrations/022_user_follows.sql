-- Follow relationships between users
CREATE TABLE IF NOT EXISTS public.user_follows (
    follower_id UUID NOT NULL,
    following_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id <> following_id)
);

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- Only the server (service role) reads and writes follows
CREATE POLICY "Allow service role full access on user_follows"
ON public.user_follows
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_user_follows_following ON public.user_follows (following_id);
