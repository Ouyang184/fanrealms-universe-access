-- Secure RPCs to replace unsafe access to public.commission
-- Functions enforce participant-only access and return commission data

-- 1) Detail endpoint for a single commission request
CREATE OR REPLACE FUNCTION public.get_commission_request_secure(p_commission_id uuid)
RETURNS TABLE (
  id uuid,
  commission_type_id uuid,
  customer_id uuid,
  creator_id uuid,
  title text,
  description text,
  reference_images text[],
  budget_range_min numeric,
  budget_range_max numeric,
  agreed_price numeric,
  status text,
  deadline timestamptz,
  customer_notes text,
  creator_notes text,
  selected_addons jsonb,
  stripe_payment_intent_id text,
  platform_fee_amount numeric,
  created_at timestamptz,
  updated_at timestamptz,
  revision_count integer,
  commission_type_name text,
  commission_type_base_price numeric,
  customer_username text,
  customer_profile_picture text
) AS $$
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
    ct.name AS commission_type_name,
    ct.base_price AS commission_type_base_price,
    u.username AS customer_username,
    u.profile_picture AS customer_profile_picture
  FROM public.commission_requests cr
  LEFT JOIN public.commission_types ct ON ct.id = cr.commission_type_id
  LEFT JOIN public.users u ON u.id = cr.customer_id
  WHERE cr.id = p_commission_id
    AND (
      cr.customer_id = auth.uid()
      OR cr.creator_id IN (
        SELECT c.id FROM public.creators c WHERE c.user_id = auth.uid()
      )
    )
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_commission_request_secure(uuid) TO authenticated;

-- 2) List endpoint for current user's commissions with optional filters
CREATE OR REPLACE FUNCTION public.list_my_commission_requests(
  p_role text DEFAULT 'all',          -- 'customer' | 'creator' | 'all'
  p_status text DEFAULT NULL,         -- optional status filter
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  commission_type_id uuid,
  customer_id uuid,
  creator_id uuid,
  title text,
  agreed_price numeric,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  commission_type_name text,
  commission_type_base_price numeric
) AS $$
  WITH base AS (
    SELECT cr.*, ct.name AS commission_type_name, ct.base_price AS commission_type_base_price
    FROM public.commission_requests cr
    LEFT JOIN public.commission_types ct ON ct.id = cr.commission_type_id
    WHERE (
      (p_role = 'customer' AND cr.customer_id = auth.uid())
      OR (p_role = 'creator' AND cr.creator_id IN (
        SELECT c.id FROM public.creators c WHERE c.user_id = auth.uid()
      ))
      OR (p_role = 'all' AND (
        cr.customer_id = auth.uid() OR cr.creator_id IN (
          SELECT c.id FROM public.creators c WHERE c.user_id = auth.uid()
        )
      ))
    )
    AND (p_status IS NULL OR cr.status = p_status)
  )
  SELECT 
    id,
    commission_type_id,
    customer_id,
    creator_id,
    title,
    agreed_price,
    status,
    created_at,
    updated_at,
    commission_type_name,
    commission_type_base_price
  FROM base
  ORDER BY created_at DESC
  LIMIT LEAST(GREATEST(p_limit, 0), 100)
  OFFSET GREATEST(p_offset, 0);
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.list_my_commission_requests(text, text, integer, integer) TO authenticated;