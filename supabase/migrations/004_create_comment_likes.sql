-- Migration to add comment likes support

-- 1. Add like_count column to devotional_comments if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='devotional_comments' AND column_name='like_count'
  ) THEN
    ALTER TABLE devotional_comments ADD COLUMN like_count BIGINT NOT NULL DEFAULT 0 CHECK (like_count >= 0);
  END IF;
END $$;

-- 2. Create comment like sessions table
CREATE TABLE IF NOT EXISTS devotional_comment_like_sessions (
  comment_id UUID NOT NULL REFERENCES devotional_comments(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  liked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (comment_id, session_id)
);

-- 3. Enable RLS
ALTER TABLE devotional_comment_like_sessions ENABLE ROW LEVEL SECURITY;

-- 4. Policies for devotional_comment_like_sessions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'devotional_comment_like_sessions' AND policyname = 'Allow public read comment_like_sessions') THEN
    CREATE POLICY "Allow public read comment_like_sessions" ON devotional_comment_like_sessions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'devotional_comment_like_sessions' AND policyname = 'Allow public insert comment_like_sessions') THEN
    CREATE POLICY "Allow public insert comment_like_sessions" ON devotional_comment_like_sessions FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'devotional_comment_like_sessions' AND policyname = 'Allow public delete comment_like_sessions') THEN
    CREATE POLICY "Allow public delete comment_like_sessions" ON devotional_comment_like_sessions FOR DELETE USING (true);
  END IF;
END $$;

-- 5. Stored function to toggle comment likes
CREATE OR REPLACE FUNCTION toggle_comment_like(p_comment_id UUID, p_session_id TEXT)
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
  SELECT EXISTS (
    SELECT 1
    FROM devotional_comment_like_sessions
    WHERE comment_id = p_comment_id AND session_id = p_session_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM devotional_comment_like_sessions
    WHERE comment_id = p_comment_id AND session_id = p_session_id;

    UPDATE devotional_comments
    SET like_count = GREATEST(like_count - 1, 0)
    WHERE id = p_comment_id;

    v_liked := FALSE;
  ELSE
    INSERT INTO devotional_comment_like_sessions (comment_id, session_id)
    VALUES (p_comment_id, p_session_id);

    UPDATE devotional_comments
    SET like_count = like_count + 1
    WHERE id = p_comment_id;

    v_liked := TRUE;
  END IF;

  SELECT COALESCE(like_count, 0) INTO v_count
  FROM devotional_comments
  WHERE id = p_comment_id;

  RETURN json_build_object(
    'like_count', COALESCE(v_count, 0),
    'liked', v_liked
  );
END;
$$;
