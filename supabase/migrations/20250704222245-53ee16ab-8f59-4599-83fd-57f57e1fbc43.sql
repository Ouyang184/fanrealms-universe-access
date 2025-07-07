
-- Add custom_addons column to commission_types table
ALTER TABLE public.commission_types 
ADD COLUMN custom_addons JSONB DEFAULT '[]'::jsonb;
