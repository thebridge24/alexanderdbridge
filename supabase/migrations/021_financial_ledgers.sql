-- Create financial_ledgers table
CREATE TABLE IF NOT EXISTS public.financial_ledgers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    category TEXT NOT NULL DEFAULT 'General',
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    narration TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.financial_ledgers ENABLE ROW LEVEL SECURITY;

-- Allow service role full access to manage records
CREATE POLICY "Allow service role full access on financial_ledgers"
ON public.financial_ledgers
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Indexes for optimal querying by date and type
CREATE INDEX IF NOT EXISTS idx_financial_ledgers_date ON public.financial_ledgers (date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_ledgers_type ON public.financial_ledgers (type);