
CREATE OR REPLACE FUNCTION public.get_public_user_profiles(_user_ids uuid[])
RETURNS TABLE (id uuid, username text, profile_picture text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.username, u.profile_picture
  FROM public.users u
  WHERE u.id = ANY(_user_ids);
$$;

GRANT EXECUTE ON FUNCTION public.get_public_user_profiles(uuid[]) TO anon, authenticated;
