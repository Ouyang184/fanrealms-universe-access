-- Fix security warnings from the previous migration

-- 1. Fix the security definer view issue by converting to a function
DROP VIEW IF EXISTS public.payment_security_summary;

-- Create a secure function instead of a view
CREATE OR REPLACE FUNCTION public.get_payment_security_summary()
RETURNS TABLE(
  table_name TEXT,
  total_records BIGINT,
  unique_users BIGINT,
  oldest_record TIMESTAMPTZ,
  newest_record TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow service role to access this function
  IF auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Access denied: Service role required';
  END IF;
  
  RETURN QUERY
  SELECT 
    'payment_methods'::TEXT as table_name,
    COUNT(*)::BIGINT as total_records,
    COUNT(DISTINCT user_id)::BIGINT as unique_users,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record
  FROM public.payment_methods
  UNION ALL
  SELECT 
    'stripe_customers'::TEXT as table_name,
    COUNT(*)::BIGINT as total_records,
    COUNT(DISTINCT user_id)::BIGINT as unique_users,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record
  FROM public.stripe_customers;
END;
$$;

-- 2. Fix all functions with missing search_path
CREATE OR REPLACE FUNCTION public.log_payment_access(
  p_table_name TEXT,
  p_operation TEXT,
  p_accessed_data JSONB DEFAULT NULL
)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.payment_audit_log (
    table_name,
    operation,
    user_id,
    accessed_data
  ) VALUES (
    p_table_name,
    p_operation,
    auth.uid(),
    p_accessed_data
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_payment_methods_access()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log SELECT operations (when RLS policies are accessed)
  IF TG_OP = 'SELECT' THEN
    PERFORM public.log_payment_access(
      'payment_methods', 
      'SELECT',
      jsonb_build_object('accessed_user_id', NEW.user_id)
    );
    RETURN NEW;
  END IF;
  
  -- Log modification operations
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_payment_access(
      'payment_methods', 
      'INSERT',
      jsonb_build_object('payment_method_id', NEW.id, 'user_id', NEW.user_id)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_payment_access(
      'payment_methods', 
      'UPDATE',
      jsonb_build_object('payment_method_id', NEW.id, 'user_id', NEW.user_id)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_payment_access(
      'payment_methods', 
      'DELETE',
      jsonb_build_object('payment_method_id', OLD.id, 'user_id', OLD.user_id)
    );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_payment_methods_secure(p_user_id UUID)
RETURNS TABLE(
  id UUID,
  type TEXT,
  card_brand TEXT,
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN,
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify the requesting user matches the data owner
  IF auth.uid() != p_user_id AND auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized access to payment methods';
  END IF;
  
  -- Log the access
  PERFORM public.log_payment_access(
    'payment_methods',
    'SECURE_SELECT',
    jsonb_build_object('requested_user_id', p_user_id, 'auth_user_id', auth.uid())
  );
  
  -- Return filtered data (excluding Stripe IDs for extra security)
  RETURN QUERY
  SELECT 
    pm.id,
    pm.type,
    pm.card_brand,
    pm.card_last4,
    pm.card_exp_month,
    pm.card_exp_year,
    pm.is_default,
    pm.created_at
  FROM public.payment_methods pm
  WHERE pm.user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_payment_rate_limit(
  p_user_id UUID,
  p_operation TEXT,
  p_limit INTEGER DEFAULT 10,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  operation_count INTEGER;
BEGIN
  -- Count recent operations
  SELECT COUNT(*) INTO operation_count
  FROM public.payment_rate_limits
  WHERE user_id = p_user_id
    AND operation = p_operation
    AND created_at > now() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Log this rate limit check
  INSERT INTO public.payment_rate_limits (user_id, operation, ip_address)
  VALUES (p_user_id, p_operation || '_check', inet_client_addr());
  
  RETURN operation_count < p_limit;
END;
$$;