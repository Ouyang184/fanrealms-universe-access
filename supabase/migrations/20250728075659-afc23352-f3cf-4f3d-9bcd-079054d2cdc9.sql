-- Fix the security warning by adding SET search_path to the function
CREATE OR REPLACE FUNCTION public.update_tag_usage_count()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;