-- Migration: 018_add_notification_avatar_url.sql
-- Adds optional avatar_url to notification_events so comment likes and replies display the actor's avatar.

ALTER TABLE public.notification_events
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;
