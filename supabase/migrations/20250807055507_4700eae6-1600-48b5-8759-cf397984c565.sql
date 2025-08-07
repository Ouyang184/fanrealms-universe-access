-- Add price_per_character column to commission_types table
ALTER TABLE public.commission_types 
ADD COLUMN price_per_character numeric;

-- Add a comment to explain the column
COMMENT ON COLUMN public.commission_types.price_per_character IS 'Optional pricing per character for character-based commissions';