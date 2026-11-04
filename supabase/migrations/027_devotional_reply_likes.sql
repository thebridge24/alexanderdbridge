-- 1. Add like_count to replies
ALTER TABLE devotional_comment_replies
ADD COLUMN IF NOT EXISTS like_count BIGINT NOT NULL DEFAULT 0
CHECK (like_count >= 0);

-- 2. Create reply like sessions
CREATE TABLE IF NOT EXISTS devotional_comment_reply_like_sessions (
  reply_id UUID NOT NULL
    REFERENCES devotional_comment_replies(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  liked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (reply_id, session_id)
);

-- 3. Enable RLS
ALTER TABLE devotional_comment_reply_like_sessions ENABLE ROW LEVEL SECURITY;

-- 4. Create reply like toggle function
CREATE OR REPLACE FUNCTION toggle_comment_reply_like(
  p_reply_id UUID,
  p_session_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists BOOLEAN;
  v_count BIGINT;
  v_liked BOOLEAN;
BEGIN
  -- Lock the reply row so simultaneous toggles cannot corrupt its count.
  SELECT like_count
  INTO v_count
  FROM devotional_comment_replies
  WHERE id = p_reply_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reply not found';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM devotional_comment_reply_like_sessions
    WHERE reply_id = p_reply_id
      AND session_id = p_session_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM devotional_comment_reply_like_sessions
    WHERE reply_id = p_reply_id
      AND session_id = p_session_id;

    UPDATE devotional_comment_replies
    SET like_count = GREATEST(like_count - 1, 0)
    WHERE id = p_reply_id;

    v_liked := FALSE;
  ELSE
    INSERT INTO devotional_comment_reply_like_sessions (
      reply_id,
      session_id
    )
    VALUES (p_reply_id, p_session_id);

    UPDATE devotional_comment_replies
    SET like_count = like_count + 1
    WHERE id = p_reply_id;

    v_liked := TRUE;
  END IF;

  SELECT COALESCE(like_count, 0)
  INTO v_count
  FROM devotional_comment_replies
  WHERE id = p_reply_id;

  RETURN json_build_object(
    'like_count', COALESCE(v_count, 0),
    'liked', v_liked
  );
END;
$$;

-- 5. Restrict direct execution to the server's service role
REVOKE ALL ON FUNCTION toggle_comment_reply_like(UUID, TEXT)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION toggle_comment_reply_like(UUID, TEXT)
TO service_role;