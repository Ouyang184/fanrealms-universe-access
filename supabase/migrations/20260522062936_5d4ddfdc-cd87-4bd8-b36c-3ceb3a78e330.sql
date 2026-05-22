
CREATE TABLE IF NOT EXISTS public.pending_2fa_challenges (
  email text PRIMARY KEY,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pending_2fa_challenges ENABLE ROW LEVEL SECURITY;

DROP FUNCTION IF EXISTS public.get_creator_business_profile_secure(uuid);
CREATE OR REPLACE FUNCTION public.get_creator_business_profile_secure(p_creator_id uuid)
 RETURNS TABLE(id uuid, user_id uuid, display_name text, bio text, profile_image_url text, banner_url text, website text, tags text[], follower_count integer, is_nsfw boolean, created_at timestamp with time zone, username text, accepts_commissions boolean, commission_base_rate numeric, commission_turnaround_days integer, commission_slots_available integer, commission_tos text, stripe_onboarding_complete boolean, stripe_charges_enabled boolean, stripe_payouts_enabled boolean)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT c.id, c.user_id, c.display_name, c.bio, c.profile_image_url, c.banner_url, c.website, c.tags,
    c.follower_count, c.is_nsfw, c.created_at, u.username,
    c.accepts_commissions, c.commission_base_rate, c.commission_turnaround_days,
    c.commission_slots_available, c.commission_tos,
    CASE WHEN c.user_id = auth.uid() THEN COALESCE(csa.stripe_onboarding_complete, false) ELSE NULL END,
    CASE WHEN c.user_id = auth.uid() THEN COALESCE(csa.stripe_charges_enabled, false) ELSE NULL END,
    CASE WHEN c.user_id = auth.uid() THEN COALESCE(csa.stripe_payouts_enabled, false) ELSE NULL END
  FROM public.creators c
  LEFT JOIN public.users u ON u.id = c.user_id
  LEFT JOIN public.creator_stripe_accounts csa ON csa.creator_id = c.id
  WHERE c.id = p_creator_id AND c.user_id = auth.uid();
$function$;

DROP FUNCTION IF EXISTS public.get_creator_profile_secure(uuid, text, text);
CREATE OR REPLACE FUNCTION public.get_creator_profile_secure(p_creator_id uuid DEFAULT NULL::uuid, p_username text DEFAULT NULL::text, p_display_name text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, user_id uuid, display_name text, bio text, profile_image_url text, banner_url text, website text, tags text[], follower_count integer, is_nsfw boolean, created_at timestamp with time zone, updated_at timestamp with time zone, accepts_commissions boolean, commission_base_rate numeric, commission_turnaround_days integer, commission_slots_available integer, commission_tos text, stripe_onboarding_complete boolean, stripe_charges_enabled boolean, stripe_payouts_enabled boolean, is_owner boolean)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  target_creator_id uuid;
  is_creator_owner boolean := false;
BEGIN
  IF p_creator_id IS NOT NULL THEN
    target_creator_id := p_creator_id;
  ELSIF p_username IS NOT NULL THEN
    SELECT c.id INTO target_creator_id FROM public.creators c JOIN public.users u ON u.id = c.user_id WHERE u.username = p_username LIMIT 1;
  ELSIF p_display_name IS NOT NULL THEN
    SELECT c.id INTO target_creator_id FROM public.creators c WHERE c.display_name = p_display_name LIMIT 1;
  END IF;

  IF auth.uid() IS NOT NULL AND target_creator_id IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM public.creators c WHERE c.id = target_creator_id AND c.user_id = auth.uid()) INTO is_creator_owner;
  END IF;

  RETURN QUERY
  SELECT c.id, c.user_id, c.display_name, c.bio, c.profile_image_url, c.banner_url, c.website, c.tags,
    c.follower_count, c.is_nsfw, c.created_at, c.updated_at,
    CASE WHEN is_creator_owner THEN c.accepts_commissions ELSE NULL END,
    CASE WHEN is_creator_owner THEN c.commission_base_rate ELSE NULL END,
    CASE WHEN is_creator_owner THEN c.commission_turnaround_days ELSE NULL END,
    CASE WHEN is_creator_owner THEN c.commission_slots_available ELSE NULL END,
    CASE WHEN is_creator_owner THEN c.commission_tos ELSE NULL END,
    CASE WHEN is_creator_owner THEN COALESCE(csa.stripe_onboarding_complete, false) ELSE NULL END,
    CASE WHEN is_creator_owner THEN COALESCE(csa.stripe_charges_enabled, false) ELSE NULL END,
    CASE WHEN is_creator_owner THEN COALESCE(csa.stripe_payouts_enabled, false) ELSE NULL END,
    is_creator_owner
  FROM public.creators c
  LEFT JOIN public.creator_stripe_accounts csa ON csa.creator_id = c.id
  WHERE (target_creator_id IS NULL OR c.id = target_creator_id);
END;
$function$;

DROP FUNCTION IF EXISTS public.get_creator_settings_secure(uuid);
CREATE OR REPLACE FUNCTION public.get_creator_settings_secure(p_user_id uuid)
 RETURNS TABLE(id uuid, user_id uuid, display_name text, bio text, profile_image_url text, banner_url text, website text, tags text[], is_nsfw boolean, follower_count integer, accepts_commissions boolean, commission_base_rate numeric, commission_turnaround_days integer, commission_slots_available integer, commission_tos text, stripe_onboarding_complete boolean, stripe_charges_enabled boolean, stripe_payouts_enabled boolean, created_at timestamp with time zone, updated_at timestamp with time zone, users jsonb)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT c.id, c.user_id, c.display_name, c.bio, c.profile_image_url, c.banner_url, c.website, c.tags,
    c.is_nsfw, c.follower_count, c.accepts_commissions, c.commission_base_rate,
    c.commission_turnaround_days, c.commission_slots_available, c.commission_tos,
    COALESCE(csa.stripe_onboarding_complete, false),
    COALESCE(csa.stripe_charges_enabled, false),
    COALESCE(csa.stripe_payouts_enabled, false),
    c.created_at, c.updated_at,
    CASE WHEN auth.uid() = c.user_id THEN
      jsonb_build_object('username', u.username, 'email', u.email, 'creator_name', u.creator_name)
    ELSE
      jsonb_build_object('username', u.username, 'creator_name', u.creator_name)
    END as users
  FROM public.creators c
  LEFT JOIN public.users u ON u.id = c.user_id
  LEFT JOIN public.creator_stripe_accounts csa ON csa.creator_id = c.id
  WHERE c.user_id = p_user_id;
$function$;
