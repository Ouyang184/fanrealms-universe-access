
-- Add the is_nsfw_enabled column to users table if it doesn't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_nsfw_enabled BOOLEAN DEFAULT false;

-- Update any existing users to have the default value
UPDATE public.users 
SET is_nsfw_enabled = false 
WHERE is_nsfw_enabled IS NULL;
