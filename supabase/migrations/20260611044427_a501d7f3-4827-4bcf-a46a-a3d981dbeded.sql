CREATE OR REPLACE FUNCTION public.get_my_job_listing_contact(_listing_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT contact_info
  FROM public.job_listings
  WHERE id = _listing_id
    AND poster_id = auth.uid()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_job_listing_contact(uuid) TO authenticated;
