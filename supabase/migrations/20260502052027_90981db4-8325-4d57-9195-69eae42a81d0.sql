
-- Fix 1: Add caller verification to get_user_commission_requests_with_details
CREATE OR REPLACE FUNCTION public.get_user_commission_requests_with_details(p_customer_id uuid)
 RETURNS TABLE(id uuid, commission_type_id uuid, customer_id uuid, creator_id uuid, title text, description text, reference_images text[], budget_range_min numeric, budget_range_max numeric, agreed_price numeric, status text, deadline timestamp with time zone, customer_notes text, creator_notes text, selected_addons jsonb, stripe_payment_intent_id text, platform_fee_amount numeric, created_at timestamp with time zone, updated_at timestamp with time zone, revision_count integer, commission_type_name text, commission_type_base_price numeric, commission_type_max_revisions integer, commission_type_price_per_revision numeric, creator_display_name text, creator_profile_image_url text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Caller must be the customer they're querying for
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM p_customer_id THEN
    RAISE EXCEPTION 'Unauthorized: callers may only request their own commission history';
  END IF;

  RETURN QUERY
  SELECT 
    cr.id,
    cr.commission_type_id,
    cr.customer_id,
    cr.creator_id,
    cr.title,
    cr.description,
    cr.reference_images,
    cr.budget_range_min,
    cr.budget_range_max,
    cr.agreed_price,
    cr.status,
    cr.deadline,
    cr.customer_notes,
    cr.creator_notes,
    cr.selected_addons,
    cr.stripe_payment_intent_id,
    cr.platform_fee_amount,
    cr.created_at,
    cr.updated_at,
    cr.revision_count,
    ct.name as commission_type_name,
    ct.base_price as commission_type_base_price,
    ct.max_revisions as commission_type_max_revisions,
    ct.price_per_revision as commission_type_price_per_revision,
    c.display_name as creator_display_name,
    c.profile_image_url as creator_profile_image_url
  FROM public.commission_requests cr
  LEFT JOIN public.commission_types ct ON cr.commission_type_id = ct.id
  LEFT JOIN public.creators c ON cr.creator_id = c.id
  WHERE cr.customer_id = p_customer_id
  ORDER BY cr.created_at DESC;
END;
$function$;

-- Fix 2: Public SELECT on creator_links so social/portfolio links render on public profiles
DROP POLICY IF EXISTS "Public can view creator links" ON public.creator_links;
CREATE POLICY "Public can view creator links"
  ON public.creator_links
  FOR SELECT
  USING (true);

-- Fix 3: Tighten post_shares INSERT to prevent attribution spoofing
DROP POLICY IF EXISTS "Anyone can record shares" ON public.post_shares;
DROP POLICY IF EXISTS "Users can only record their own shares" ON public.post_shares;
CREATE POLICY "Users can only record their own shares"
  ON public.post_shares
  FOR INSERT
  WITH CHECK (
    user_id IS NULL
    OR user_id = auth.uid()
  );
