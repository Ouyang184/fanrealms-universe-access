-- Tighten security around creator_earnings and add secure RPCs

-- 1) Ensure RLS is strictly enforced even for table owners
ALTER TABLE public.creator_earnings FORCE ROW LEVEL SECURITY;

-- 2) Reduce direct table exposure for anonymous role
REVOKE SELECT ON TABLE public.creator_earnings FROM anon;

-- 3) Create SECURITY DEFINER RPC to fetch only the caller's earnings (Stripe IDs omitted)
CREATE OR REPLACE FUNCTION public.get_my_creator_earnings(
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
) RETURNS TABLE (
  id uuid,
  creator_id uuid,
  earning_type text,
  amount numeric,
  platform_fee numeric,
  net_amount numeric,
  payment_date timestamptz,
  subscription_id uuid,
  commission_request_id uuid
) LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public AS $$
  SELECT
    ce.id,
    ce.creator_id,
    ce.earning_type,
    ce.amount,
    ce.platform_fee,
    ce.net_amount,
    ce.payment_date,
    ce.subscription_id,
    ce.commission_request_id
  FROM public.creator_earnings ce
  WHERE ce.creator_id IN (
    SELECT c.id FROM public.creators c WHERE c.user_id = auth.uid()
  )
  AND (p_start_date IS NULL OR ce.payment_date >= p_start_date)
  AND (p_end_date IS NULL OR ce.payment_date <= p_end_date)
  ORDER BY ce.payment_date DESC NULLS LAST, ce.created_at DESC NULLS LAST
  LIMIT LEAST(GREATEST(p_limit, 0), 500)
  OFFSET GREATEST(p_offset, 0);
$$;

-- Secure function privileges: allow only authenticated to execute
REVOKE ALL ON FUNCTION public.get_my_creator_earnings(integer, integer, timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_creator_earnings(integer, integer, timestamptz, timestamptz) TO authenticated;

-- 4) Optional: Summary RPC for totals without exposing individual rows
CREATE OR REPLACE FUNCTION public.get_my_creator_earnings_summary(
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
) RETURNS TABLE (
  total_amount numeric,
  total_platform_fees numeric,
  total_net numeric,
  count_records bigint
) LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public AS $$
  SELECT
    COALESCE(SUM(ce.amount), 0) AS total_amount,
    COALESCE(SUM(ce.platform_fee), 0) AS total_platform_fees,
    COALESCE(SUM(ce.net_amount), 0) AS total_net,
    COUNT(*)::bigint AS count_records
  FROM public.creator_earnings ce
  WHERE ce.creator_id IN (
    SELECT c.id FROM public.creators c WHERE c.user_id = auth.uid()
  )
  AND (p_start_date IS NULL OR ce.payment_date >= p_start_date)
  AND (p_end_date IS NULL OR ce.payment_date <= p_end_date);
$$;

REVOKE ALL ON FUNCTION public.get_my_creator_earnings_summary(timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_creator_earnings_summary(timestamptz, timestamptz) TO authenticated;