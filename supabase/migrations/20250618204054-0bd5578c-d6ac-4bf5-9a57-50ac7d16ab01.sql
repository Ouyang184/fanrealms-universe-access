
-- Add trigger to automatically flag posts as NSFW when creator is NSFW
CREATE OR REPLACE FUNCTION public.auto_flag_nsfw_posts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Check if the creator is marked as NSFW
  IF EXISTS (
    SELECT 1 FROM public.creators c 
    WHERE c.user_id = NEW.author_id AND c.is_nsfw = true
  ) THEN
    -- Automatically flag the post as NSFW
    NEW.is_nsfw = true;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger that fires before INSERT on posts
CREATE TRIGGER trigger_auto_flag_nsfw_posts
  BEFORE INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_flag_nsfw_posts();

-- Add RLS policies for NSFW content filtering
-- Policy to hide NSFW posts from users who have NSFW disabled
CREATE POLICY "Hide NSFW posts from users with NSFW disabled" 
  ON public.posts 
  FOR SELECT 
  USING (
    -- Always show non-NSFW posts
    is_nsfw = false 
    OR 
    -- Show NSFW posts only if user has NSFW enabled or is the author
    (
      is_nsfw = true 
      AND (
        auth.uid() = author_id  -- Author can always see their own posts
        OR 
        EXISTS (
          SELECT 1 FROM public.users u 
          WHERE u.id = auth.uid() 
          AND u.is_nsfw_enabled = true
        )
      )
    )
  );

-- Enable RLS on posts table if not already enabled
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
