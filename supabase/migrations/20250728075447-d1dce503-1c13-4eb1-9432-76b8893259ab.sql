-- Add tags column to commission_types table since it doesn't have one yet
ALTER TABLE public.commission_types 
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Create a tags table to store all unique tags for autocomplete
CREATE TABLE IF NOT EXISTS public.tags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  category text DEFAULT 'general',
  usage_count integer DEFAULT 1,
  is_moderated boolean DEFAULT false,
  is_flagged boolean DEFAULT false,
  flagged_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on tags table
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Anyone can view tags
CREATE POLICY "Anyone can view tags" 
ON public.tags 
FOR SELECT 
USING (NOT is_flagged OR is_flagged = false);

-- Authenticated users can suggest tags (insert)
CREATE POLICY "Authenticated users can suggest tags" 
ON public.tags 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Only service role can moderate tags (update/delete for moderation)
CREATE POLICY "Service role can moderate tags" 
ON public.tags 
FOR ALL 
USING (auth.role() = 'service_role');

-- Function to automatically update tag usage count
CREATE OR REPLACE FUNCTION public.update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment usage count for each tag in the new post
    UPDATE public.tags 
    SET usage_count = usage_count + 1,
        updated_at = now()
    WHERE name = ANY(NEW.tags);
    
    -- Insert new tags that don't exist yet
    INSERT INTO public.tags (name, usage_count, created_at, updated_at)
    SELECT unnest(NEW.tags), 1, now(), now()
    WHERE unnest(NEW.tags) NOT IN (SELECT name FROM public.tags)
    ON CONFLICT (name) DO NOTHING;
    
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle tag changes
    -- Decrement count for removed tags
    UPDATE public.tags 
    SET usage_count = GREATEST(usage_count - 1, 0),
        updated_at = now()
    WHERE name = ANY(SELECT unnest(OLD.tags) EXCEPT SELECT unnest(NEW.tags));
    
    -- Increment count for added tags
    UPDATE public.tags 
    SET usage_count = usage_count + 1,
        updated_at = now()
    WHERE name = ANY(SELECT unnest(NEW.tags) EXCEPT SELECT unnest(OLD.tags));
    
    -- Insert new tags that don't exist yet
    INSERT INTO public.tags (name, usage_count, created_at, updated_at)
    SELECT unnest(NEW.tags), 1, now(), now()
    WHERE unnest(NEW.tags) NOT IN (SELECT name FROM public.tags)
    ON CONFLICT (name) DO NOTHING;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement usage count for all tags in deleted post
    UPDATE public.tags 
    SET usage_count = GREATEST(usage_count - 1, 0),
        updated_at = now()
    WHERE name = ANY(OLD.tags);
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for posts table
DROP TRIGGER IF EXISTS trigger_update_tag_usage_posts ON public.posts;
CREATE TRIGGER trigger_update_tag_usage_posts
  AFTER INSERT OR UPDATE OR DELETE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tag_usage_count();

-- Create triggers for commission_types table  
DROP TRIGGER IF EXISTS trigger_update_tag_usage_commission_types ON public.commission_types;
CREATE TRIGGER trigger_update_tag_usage_commission_types
  AFTER INSERT OR UPDATE OR DELETE ON public.commission_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tag_usage_count();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tags_name ON public.tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON public.tags(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_posts_tags ON public.posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_commission_types_tags ON public.commission_types USING GIN(tags);