-- Migration: 011_add_comment_author_user_id.sql
-- Attribute comments and replies to an authenticated user so we can deliver
-- targeted push notifications (likes / replies on a user's comment).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devotional_comments' AND column_name = 'author_user_id'
  ) THEN
    ALTER TABLE devotional_comments ADD COLUMN author_user_id UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devotional_comment_replies' AND column_name = 'author_user_id'
  ) THEN
    ALTER TABLE devotional_comment_replies ADD COLUMN author_user_id UUID;
  END IF;
END $$;