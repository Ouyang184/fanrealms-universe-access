
-- Fix: Replace update_tag_usage_count to avoid set-returning functions in WHERE

CREATE OR REPLACE FUNCTION public.update_tag_usage_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Insert any tags that don't exist yet
    INSERT INTO public.tags (name, usage_count, created_at, updated_at)
    SELECT DISTINCT t.name, 1, now(), now()
    FROM unnest(NEW.tags) AS t(name)
    ON CONFLICT (name) DO NOTHING;

    -- Increment usage count for each tag in the new post
    UPDATE public.tags
    SET usage_count = usage_count + 1,
        updated_at = now()
    WHERE name = ANY(NEW.tags);

    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Decrement count for removed tags
    UPDATE public.tags
    SET usage_count = GREATEST(usage_count - 1, 0),
        updated_at = now()
    WHERE name IN (
      SELECT t FROM unnest(OLD.tags) AS t
      EXCEPT
      SELECT t FROM unnest(NEW.tags) AS t
    );

    -- Insert any newly added tags that don't exist yet
    INSERT INTO public.tags (name, usage_count, created_at, updated_at)
    SELECT DISTINCT t, 1, now(), now()
    FROM (
      SELECT t FROM unnest(NEW.tags) AS t
      EXCEPT
      SELECT t FROM unnest(OLD.tags) AS t
    ) s(t)
    ON CONFLICT (name) DO NOTHING;

    -- Increment count for added tags
    UPDATE public.tags
    SET usage_count = usage_count + 1,
        updated_at = now()
    WHERE name IN (
      SELECT t FROM unnest(NEW.tags) AS t
      EXCEPT
      SELECT t FROM unnest(OLD.tags) AS t
    );

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
$function$;
