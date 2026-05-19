-- Add bio column to public.users so all users (not just creators) can set a bio.
-- The creators table already has its own bio for creator profiles;
-- this covers the general account settings bio field.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio text;
