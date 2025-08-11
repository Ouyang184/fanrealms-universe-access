-- Public-safe batch fetch by user_ids for conversations and mappings
CREATE OR REPLACE FUNCTION public.get_public_creators_by_user_ids(
  p_user_ids uuid[]
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  display_name text,
  profile_image_url text,
  bio text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    c.id,
    c.user_id,
    c.display_name,
    c.profile_image_url,
    c.bio
  FROM public.creators c
  WHERE c.user_id = ANY(p_user_ids);
$function$;

GRANT EXECUTE ON FUNCTION public.get_public_creators_by_user_ids(uuid[]) TO anon, authenticated;