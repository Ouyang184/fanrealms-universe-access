-- Fix security definer view and finalize zero-trust security

-- 1. Remove the security definer view and replace with function
DROP VIEW IF EXISTS public.payment_methods_safe;

-- 2. Create a secure function instead of the view
CREATE OR REPLACE FUNCTION public.get_safe_payment_methods(p_user_id UUID)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  type TEXT,
  card_brand TEXT,
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify authentication and authorization
  IF auth.uid() != p_user_id OR auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Access denied: Unauthorized access to payment methods';
  END IF;
  
  -- Rate limiting check
  IF NOT public.check_payment_rate_limit(auth.uid(), 'safe_payment_access', 25, 5) THEN
    RAISE EXCEPTION 'Access denied: Rate limit exceeded';
  END IF;
  
  -- Log the access
  PERFORM public.log_payment_access(
    'payment_methods',
    'SAFE_SELECT',
    jsonb_build_object('user_id', auth.uid(), 'function', 'get_safe_payment_methods')
  );
  
  -- Return data WITHOUT stripe_payment_method_id for security
  RETURN QUERY
  SELECT 
    pm.id,
    pm.user_id,
    pm.type,
    pm.card_brand,
    pm.card_last4,
    pm.card_exp_month,
    pm.card_exp_year,
    pm.is_default,
    pm.created_at,
    pm.updated_at
  FROM public.payment_methods pm
  WHERE pm.user_id = p_user_id;
END;
$$;

-- 3. Create ultra-secure function for payment operations that only returns minimal data
CREATE OR REPLACE FUNCTION public.get_user_payment_cards_display(p_user_id UUID)
RETURNS TABLE(
  id UUID,
  card_display TEXT,
  is_default BOOLEAN,
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Triple security check
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied: User ID mismatch';
  END IF;
  
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Access denied: Not authenticated';
  END IF;
  
  -- Enhanced rate limiting for display function
  IF NOT public.check_payment_rate_limit(auth.uid(), 'card_display', 15, 5) THEN
    RAISE EXCEPTION 'Access denied: Too many requests';
  END IF;
  
  -- Log with enhanced metadata
  PERFORM public.log_payment_access(
    'payment_methods',
    'DISPLAY_ONLY',
    jsonb_build_object(
      'user_id', auth.uid(),
      'function', 'get_user_payment_cards_display',
      'security_level', 'maximum'
    )
  );
  
  -- Return only display-safe information
  RETURN QUERY
  SELECT 
    pm.id,
    CASE 
      WHEN pm.card_brand IS NOT NULL AND pm.card_last4 IS NOT NULL THEN
        UPPER(pm.card_brand) || ' ending in ' || pm.card_last4
      ELSE 
        pm.type || ' payment method'
    END AS card_display,
    pm.is_default,
    pm.created_at
  FROM public.payment_methods pm
  WHERE pm.user_id = p_user_id
  ORDER BY pm.is_default DESC, pm.created_at DESC;
END;
$$;

-- 4. Remove Stripe IDs from main table structure for existing data (move to vault only)
-- This is a data migration to enhance security
DO $$
DECLARE
  rec RECORD;
  encrypted_value BYTEA;
BEGIN
  -- Move any remaining Stripe IDs to encrypted vault
  FOR rec IN SELECT id, stripe_payment_method_id FROM public.payment_methods 
             WHERE stripe_payment_method_id IS NOT NULL
             AND NOT EXISTS (
               SELECT 1 FROM public.payment_secrets_vault v 
               WHERE v.payment_method_id = payment_methods.id
             )
  LOOP
    -- Encrypt and store in vault
    encrypted_value := pgp_sym_encrypt(rec.stripe_payment_method_id, 'stripe_vault_key_2025');
    
    INSERT INTO public.payment_secrets_vault (
      payment_method_id, 
      encrypted_stripe_id, 
      encryption_key_hash,
      last_accessed
    ) VALUES (
      rec.id, 
      encrypted_value, 
      md5('stripe_vault_key_2025'),
      now()
    );
  END LOOP;
  
  -- Clear the stripe_payment_method_id from the main table for additional security
  -- (Service role can still access via vault when needed)
  UPDATE public.payment_methods 
  SET stripe_payment_method_id = NULL 
  WHERE EXISTS (
    SELECT 1 FROM public.payment_secrets_vault v 
    WHERE v.payment_method_id = payment_methods.id
  );
END;
$$;

-- 5. Add comprehensive monitoring for any unauthorized access attempts
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type TEXT,
  p_table_name TEXT,
  p_details JSONB DEFAULT '{}'
)
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.payment_security_alerts (
    alert_type,
    user_id,
    ip_address,
    attempted_data
  ) VALUES (
    p_event_type,
    auth.uid(),
    inet_client_addr(),
    jsonb_build_object(
      'table', p_table_name,
      'details', p_details,
      'timestamp', now(),
      'role', auth.role(),
      'session_context', auth.jwt()
    )
  );
END;
$$;