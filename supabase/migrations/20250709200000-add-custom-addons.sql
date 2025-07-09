
-- Add custom_addons column to commission_types table if it doesn't exist
-- The column should store an array of add-on objects with name and price
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'commission_types' 
        AND column_name = 'custom_addons'
    ) THEN
        ALTER TABLE public.commission_types 
        ADD COLUMN custom_addons JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Remove the old price_per_character column since we're replacing it with custom add-ons
ALTER TABLE public.commission_types DROP COLUMN IF EXISTS price_per_character;

-- Add custom_addons column to commission_requests to store selected add-ons and quantities
ALTER TABLE public.commission_requests 
ADD COLUMN IF NOT EXISTS selected_addons JSONB DEFAULT '[]'::jsonb;
