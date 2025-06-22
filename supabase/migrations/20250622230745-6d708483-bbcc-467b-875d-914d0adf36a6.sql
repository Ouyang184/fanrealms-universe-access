
-- Fix the security issue with get_post_view_count function by setting search_path
CREATE OR REPLACE FUNCTION public.get_post_view_count(post_id_param uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COUNT(*)::INTEGER FROM public.post_views WHERE post_id = post_id_param;
$$;
