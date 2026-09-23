-- Migration to add comment replies support

CREATE TABLE IF NOT EXISTS devotional_comment_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES devotional_comments(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL CHECK (char_length(author_name) BETWEEN 1 AND 100),
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_devotional_comment_replies_comment
  ON devotional_comment_replies (comment_id, created_at ASC);

ALTER TABLE devotional_comment_replies ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'devotional_comment_replies' AND policyname = 'Allow public read comment_replies') THEN
    CREATE POLICY "Allow public read comment_replies" ON devotional_comment_replies FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'devotional_comment_replies' AND policyname = 'Allow public insert comment_replies') THEN
    CREATE POLICY "Allow public insert comment_replies" ON devotional_comment_replies FOR INSERT WITH CHECK (true);
  END IF;
END $$;
