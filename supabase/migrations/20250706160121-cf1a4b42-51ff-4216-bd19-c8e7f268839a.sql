
-- Add new columns to creator_earnings table for commission tracking
ALTER TABLE public.creator_earnings 
ADD COLUMN IF NOT EXISTS earning_type TEXT DEFAULT 'subscription' CHECK (earning_type IN ('subscription', 'commission')),
ADD COLUMN IF NOT EXISTS commission_id UUID REFERENCES public.commission_requests(id);

-- Add index for better performance when filtering by earning type
CREATE INDEX IF NOT EXISTS idx_creator_earnings_earning_type ON public.creator_earnings(earning_type);
CREATE INDEX IF NOT EXISTS idx_creator_earnings_commission_id ON public.creator_earnings(commission_id);
