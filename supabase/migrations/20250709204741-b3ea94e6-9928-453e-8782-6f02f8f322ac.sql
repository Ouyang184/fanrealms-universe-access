-- Add selected_addons column to commission_requests table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'commission_requests' 
        AND column_name = 'selected_addons'
    ) THEN
        ALTER TABLE public.commission_requests 
        ADD COLUMN selected_addons JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Remove the old price_per_character column from commission_types if it exists
ALTER TABLE public.commission_types DROP COLUMN IF EXISTS price_per_character;