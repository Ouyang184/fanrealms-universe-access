
-- Remove the indexes first
DROP INDEX IF EXISTS public.idx_creator_earnings_commission_id;
DROP INDEX IF EXISTS public.idx_creator_earnings_earning_type;

-- Remove the columns from creator_earnings table
ALTER TABLE public.creator_earnings 
DROP COLUMN IF EXISTS commission_id,
DROP COLUMN IF EXISTS earning_type;
