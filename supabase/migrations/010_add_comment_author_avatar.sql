-- Migration: 010_add_comment_author_avatar.sql
-- Store the author's avatar URL on top-level devotional comments so avatars
-- render in the comments thread instead of just falling back to initials.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devotional_comments' AND column_name = 'author_avatar'
  ) THEN
    ALTER TABLE devotional_comments ADD COLUMN author_avatar TEXT DEFAULT '';
  END IF;
END $$;