
-- First, drop all existing triggers that depend on the function
DROP TRIGGER IF EXISTS update_creator_follower_count_trigger ON public.follows;
DROP TRIGGER IF EXISTS follows_follower_count_trigger ON public.follows;
DROP TRIGGER IF EXISTS on_follow_update_follower_count ON public.follows;

-- Now we can safely drop the function
DROP FUNCTION IF EXISTS public.update_creator_follower_count_from_follows() CASCADE;

-- Create a more reliable function to update follower counts
CREATE OR REPLACE FUNCTION public.update_creator_follower_count_from_follows()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment follower count
    UPDATE public.creators 
    SET follower_count = (
      SELECT COUNT(*) FROM public.follows WHERE creator_id = NEW.creator_id
    )
    WHERE id = NEW.creator_id;
    
    RAISE NOTICE 'Follower count updated after INSERT for creator %', NEW.creator_id;
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement follower count
    UPDATE public.creators 
    SET follower_count = (
      SELECT COUNT(*) FROM public.follows WHERE creator_id = OLD.creator_id
    )
    WHERE id = OLD.creator_id;
    
    RAISE NOTICE 'Follower count updated after DELETE for creator %', OLD.creator_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create the trigger
CREATE TRIGGER update_creator_follower_count_trigger
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_creator_follower_count_from_follows();

-- Ensure RLS policies are correct for follows table
-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Anyone can view follows" ON public.follows;
DROP POLICY IF EXISTS "Authenticated users can create follows" ON public.follows;
DROP POLICY IF EXISTS "Users can delete their own follows" ON public.follows;

-- Recreate RLS policies
CREATE POLICY "Anyone can view follows" 
  ON public.follows 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create follows" 
  ON public.follows 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own follows" 
  ON public.follows 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Fix any existing follower counts by recalculating them
UPDATE public.creators 
SET follower_count = (
  SELECT COUNT(*) 
  FROM public.follows 
  WHERE follows.creator_id = creators.id
);
