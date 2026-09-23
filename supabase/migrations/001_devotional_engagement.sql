-- Devotional engagement: comments, views, and likes keyed by date (YYYY-MM-DD)

CREATE TABLE IF NOT EXISTS devotional_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devotional_date TEXT NOT NULL,
  author_name TEXT NOT NULL CHECK (char_length(author_name) BETWEEN 1 AND 100),
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_devotional_comments_date
  ON devotional_comments (devotional_date, created_at DESC);

CREATE TABLE IF NOT EXISTS devotional_views (
  devotional_date TEXT PRIMARY KEY,
  view_count BIGINT NOT NULL DEFAULT 0 CHECK (view_count >= 0)
);

CREATE TABLE IF NOT EXISTS devotional_view_sessions (
  devotional_date TEXT NOT NULL,
  session_id TEXT NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (devotional_date, session_id)
);

CREATE TABLE IF NOT EXISTS devotional_likes (
  devotional_date TEXT PRIMARY KEY,
  like_count BIGINT NOT NULL DEFAULT 0 CHECK (like_count >= 0)
);

CREATE TABLE IF NOT EXISTS devotional_like_sessions (
  devotional_date TEXT NOT NULL,
  session_id TEXT NOT NULL,
  liked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (devotional_date, session_id)
);

ALTER TABLE devotional_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE devotional_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE devotional_view_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE devotional_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE devotional_like_sessions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION increment_devotional_view(p_date TEXT, p_session_id TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_session devotional_view_sessions%ROWTYPE;
  v_count BIGINT;
BEGIN
  INSERT INTO devotional_view_sessions (devotional_date, session_id)
  VALUES (p_date, p_session_id)
  ON CONFLICT DO NOTHING
  RETURNING * INTO v_new_session;

  IF v_new_session IS NOT NULL THEN
    INSERT INTO devotional_views (devotional_date, view_count)
    VALUES (p_date, 1)
    ON CONFLICT (devotional_date) DO UPDATE
    SET view_count = devotional_views.view_count + 1;
  END IF;

  SELECT COALESCE(view_count, 0) INTO v_count
  FROM devotional_views
  WHERE devotional_date = p_date;

  RETURN COALESCE(v_count, 0);
END;
$$;

CREATE OR REPLACE FUNCTION toggle_devotional_like(p_date TEXT, p_session_id TEXT)
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
    FROM devotional_like_sessions
    WHERE devotional_date = p_date AND session_id = p_session_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM devotional_like_sessions
    WHERE devotional_date = p_date AND session_id = p_session_id;

    INSERT INTO devotional_likes (devotional_date, like_count)
    VALUES (p_date, 0)
    ON CONFLICT (devotional_date) DO UPDATE
    SET like_count = GREATEST(devotional_likes.like_count - 1, 0);

    v_liked := FALSE;
  ELSE
    INSERT INTO devotional_like_sessions (devotional_date, session_id)
    VALUES (p_date, p_session_id);

    INSERT INTO devotional_likes (devotional_date, like_count)
    VALUES (p_date, 1)
    ON CONFLICT (devotional_date) DO UPDATE
    SET like_count = devotional_likes.like_count + 1;

    v_liked := TRUE;
  END IF;

  SELECT COALESCE(like_count, 0) INTO v_count
  FROM devotional_likes
  WHERE devotional_date = p_date;

  RETURN json_build_object(
    'like_count', COALESCE(v_count, 0),
    'liked', v_liked
  );
END;
$$;
