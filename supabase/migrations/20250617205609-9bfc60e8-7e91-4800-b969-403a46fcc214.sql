
-- Add is_nsfw_enabled column to users table
ALTER TABLE public.users 
ADD COLUMN is_nsfw_enabled boolean NOT NULL DEFAULT false;
