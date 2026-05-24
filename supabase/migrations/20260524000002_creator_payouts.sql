-- supabase/migrations/20260524000002_creator_payouts.sql

-- 1. Add platform_fee_rate to creators (1-5%, default 5)
ALTER TABLE public.creators
  ADD COLUMN IF NOT EXISTS platform_fee_rate integer NOT NULL DEFAULT 5
  CHECK (platform_fee_rate BETWEEN 1 AND 5);

-- 2. Add purchase_id and status to creator_earnings
ALTER TABLE public.creator_earnings
  ADD COLUMN IF NOT EXISTS purchase_id uuid REFERENCES public.purchases(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'transferred', 'failed'));

-- 3. Index for efficient pending earnings lookups
CREATE INDEX IF NOT EXISTS creator_earnings_creator_status_idx
  ON public.creator_earnings(creator_id, status);
