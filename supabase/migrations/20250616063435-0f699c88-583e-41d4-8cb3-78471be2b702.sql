
-- Fix the security definer functions to have proper search_path
CREATE OR REPLACE FUNCTION public.user_has_tier_access(tier_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_subscriptions us
    WHERE us.user_id = auth.uid()
    AND us.tier_id = tier_id_param
    AND us.status = 'active'
    AND (us.current_period_end IS NULL OR us.current_period_end > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path TO '';

CREATE OR REPLACE FUNCTION public.user_owns_post(post_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.posts p
    WHERE p.id = post_id_param
    AND p.author_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path TO '';
