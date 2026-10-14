-- Migration: 017_create_email_logs.sql
-- Creates an audit table for email dispatches, logging delivery successes and failures with reasons

CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient TEXT NOT NULL,
  sender TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  error_message TEXT,
  error_details TEXT,
  sendbyte_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.email_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at DESC);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'email_logs' AND policyname = 'Service role full access email_logs'
  ) THEN
    CREATE POLICY "Service role full access email_logs" ON public.email_logs
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

GRANT ALL ON public.email_logs TO service_role;
GRANT SELECT ON public.email_logs TO authenticated;
