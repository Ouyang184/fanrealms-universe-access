-- Add sample_art_url column to commission_types table
ALTER TABLE public.commission_types 
ADD COLUMN sample_art_url TEXT;