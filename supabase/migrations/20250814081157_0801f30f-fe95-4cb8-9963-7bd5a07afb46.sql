-- Create function to get user commission requests with details
CREATE OR REPLACE FUNCTION public.get_user_commission_requests_with_details(p_customer_id uuid)
RETURNS TABLE(
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
  deadline timestamp with time zone,
  customer_notes text,
  creator_notes text,
  selected_addons jsonb,
  stripe_payment_intent_id text,
  platform_fee_amount numeric,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  revision_count integer,
  commission_type_name text,
  commission_type_base_price numeric,
  commission_type_max_revisions integer,
  commission_type_price_per_revision numeric,
  creator_display_name text,
  creator_profile_image_url text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;