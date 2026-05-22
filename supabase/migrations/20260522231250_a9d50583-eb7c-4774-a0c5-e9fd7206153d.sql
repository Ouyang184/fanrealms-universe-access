
-- Re-assert column-level revokes for all raw Stripe identifiers
REVOKE SELECT (stripe_session_id) ON public.bundle_purchases FROM anon, authenticated;
REVOKE SELECT (stripe_transfer_id) ON public.creator_earnings FROM anon, authenticated;
REVOKE SELECT (stripe_account_id) ON public.creator_stripe_accounts FROM anon, authenticated;
REVOKE SELECT (stripe_price_id, stripe_product_id) ON public.membership_tiers FROM anon, authenticated;
REVOKE SELECT (stripe_subscription_id, stripe_customer_id) ON public.user_subscriptions FROM anon, authenticated;

-- Harden user_can_access_post_attachment: replace LIKE substring match with exact element/url match
CREATE OR REPLACE FUNCTION public.user_can_access_post_attachment(object_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  folder_creator text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  folder_creator := (storage.foldername(object_name))[1];

  -- Owner of the folder (the creator/author) always has access
  IF folder_creator = auth.uid()::text THEN
    RETURN true;
  END IF;

  -- Otherwise, the file must be referenced (exact match) by a post the user can access
  RETURN EXISTS (
    SELECT 1
    FROM public.posts p
    WHERE (p.author_id::text = folder_creator OR p.creator_id::text = folder_creator)
      AND jsonb_typeof(p.attachments) = 'array'
      AND EXISTS (
        SELECT 1 FROM jsonb_array_elements(p.attachments) AS att
        WHERE att = to_jsonb(object_name)
           OR (jsonb_typeof(att) = 'object' AND (
                 att->>'url' = object_name
              OR att->>'path' = object_name
              OR att->>'name' = object_name
              OR att->>'url' LIKE '%/' || object_name
              OR att->>'url' LIKE '%/' || replace(object_name, ' ', '%20')
           ))
      )
      AND (
        (
          p.tier_id IS NULL
          AND NOT EXISTS (SELECT 1 FROM public.post_tiers pt WHERE pt.post_id = p.id)
        )
        OR (p.tier_id IS NOT NULL AND public.user_has_tier_access(p.tier_id))
        OR EXISTS (
          SELECT 1 FROM public.post_tiers pt
          WHERE pt.post_id = p.id
            AND public.user_has_tier_access(pt.tier_id)
        )
      )
  );
END;
$function$;
