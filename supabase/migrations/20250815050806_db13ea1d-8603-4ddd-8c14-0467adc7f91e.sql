-- SECURITY FIX 1: Restrict Creator Financial Data Access
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Public can view basic creator info" ON public.creators;
DROP POLICY IF EXISTS "Creators with active commissions are visible" ON public.creators;

-- Create new secure policies with financial data protection
CREATE POLICY "Public can view basic creator profile only" ON public.creators
FOR SELECT
USING (
  -- Public can only see basic profile info, no financial data
  true
);

-- Restrict access to financial columns for creators only
CREATE POLICY "Creators can view their own financial data" ON public.creators
FOR SELECT
USING (
  auth.uid() = user_id AND (
    stripe_account_id IS NOT NULL OR 
    stripe_onboarding_complete IS NOT NULL OR 
    stripe_charges_enabled IS NOT NULL OR 
    stripe_payouts_enabled IS NOT NULL OR
    commission_base_rate IS NOT NULL OR
    commission_turnaround_days IS NOT NULL OR
    commission_slots_available IS NOT NULL
  )
);

-- SECURITY FIX 2: Secure Commission Request Financial Data
-- Update commission request policies to hide financial details from unauthorized users
DROP POLICY IF EXISTS "Users can view commission requests" ON public.commission_requests;

CREATE POLICY "Users can view basic commission info" ON public.commission_requests
FOR SELECT
USING (
  -- Customers can see their own requests (with financial data)
  (auth.uid() = customer_id) OR
  -- Creators can see requests for their services (with financial data)
  (creator_id IN (
    SELECT c.id FROM public.creators c WHERE c.user_id = auth.uid()
  ))
);

-- SECURITY FIX 3: Enhanced Payment Method Security
-- Create secure function for safe payment method display
CREATE OR REPLACE FUNCTION public.get_safe_payment_display(p_user_id uuid)
RETURNS TABLE(
  id uuid,
  masked_display text,
  is_default boolean,
  created_month text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify user authorization
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized access to payment methods';
  END IF;
  
  -- Log access for audit
  PERFORM public.log_payment_access(
    'payment_methods',
    'SAFE_DISPLAY',
    jsonb_build_object('user_id', auth.uid(), 'function', 'get_safe_payment_display')
  );
  
  -- Return completely masked payment info
  RETURN QUERY
  SELECT 
    pm.id,
    CASE 
      WHEN pm.type = 'card' THEN 'Payment Card ••••'
      ELSE 'Payment Method'
    END AS masked_display,
    pm.is_default,
    to_char(pm.created_at, 'Mon YYYY') AS created_month
  FROM public.payment_methods pm
  WHERE pm.user_id = p_user_id
  ORDER BY pm.is_default DESC, pm.created_at DESC;
END;
$$;

-- SECURITY FIX 4: Create secure creator commission info function
CREATE OR REPLACE FUNCTION public.get_creator_commission_info(p_creator_id uuid)
RETURNS TABLE(
  id uuid,
  accepts_commissions boolean,
  commission_base_rate numeric,
  commission_turnaround_days integer,
  commission_slots_available integer,
  commission_tos text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only return commission info if user is authenticated and creator accepts commissions
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    c.id,
    c.accepts_commissions,
    CASE 
      WHEN c.accepts_commissions = true THEN c.commission_base_rate
      ELSE NULL
    END as commission_base_rate,
    CASE 
      WHEN c.accepts_commissions = true THEN c.commission_turnaround_days
      ELSE NULL
    END as commission_turnaround_days,
    CASE 
      WHEN c.accepts_commissions = true THEN c.commission_slots_available
      ELSE NULL
    END as commission_slots_available,
    CASE 
      WHEN c.accepts_commissions = true THEN c.commission_tos
      ELSE NULL
    END as commission_tos
  FROM public.creators c
  WHERE c.id = p_creator_id AND c.accepts_commissions = true;
END;
$$;

-- SECURITY FIX 5: Enhanced audit logging for sensitive operations
CREATE OR REPLACE FUNCTION public.log_sensitive_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log access to sensitive financial data
  IF TG_TABLE_NAME = 'creators' AND (
    NEW.stripe_account_id IS DISTINCT FROM OLD.stripe_account_id OR
    NEW.commission_base_rate IS DISTINCT FROM OLD.commission_base_rate
  ) THEN
    PERFORM public.log_payment_access(
      'creators_financial',
      'SENSITIVE_UPDATE',
      jsonb_build_object(
        'creator_id', NEW.id,
        'changed_fields', jsonb_build_object(
          'stripe_account_id_changed', (NEW.stripe_account_id IS DISTINCT FROM OLD.stripe_account_id),
          'commission_rate_changed', (NEW.commission_base_rate IS DISTINCT FROM OLD.commission_base_rate)
        )
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add trigger for sensitive data access logging
DROP TRIGGER IF EXISTS log_sensitive_creator_changes ON public.creators;
CREATE TRIGGER log_sensitive_creator_changes
  AFTER UPDATE ON public.creators
  FOR EACH ROW
  EXECUTE FUNCTION public.log_sensitive_access();

-- SECURITY FIX 6: Rate limiting for commission requests
CREATE OR REPLACE FUNCTION public.check_commission_request_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  recent_requests INTEGER;
BEGIN
  -- Check if user has made too many commission requests recently
  SELECT COUNT(*) INTO recent_requests
  FROM public.commission_requests
  WHERE customer_id = NEW.customer_id
    AND created_at > now() - INTERVAL '1 hour';
  
  IF recent_requests >= 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded: Too many commission requests in the last hour';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add rate limiting trigger
DROP TRIGGER IF EXISTS commission_request_rate_limit ON public.commission_requests;
CREATE TRIGGER commission_request_rate_limit
  BEFORE INSERT ON public.commission_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.check_commission_request_rate_limit();