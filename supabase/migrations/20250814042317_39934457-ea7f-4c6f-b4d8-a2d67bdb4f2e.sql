-- CRITICAL SECURITY ENHANCEMENT: Remove direct access to payment_methods table
-- This addresses the EXPOSED_PAYMENT_DATA vulnerability

-- 1. Remove direct user access to payment_methods table
DROP POLICY IF EXISTS "users_own_payment_methods_only" ON public.payment_methods;

-- 2. Add enhanced audit logging for all payment access
CREATE OR REPLACE FUNCTION public.log_secure_payment_access(
  p_operation text,
  p_user_id uuid,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.payment_audit_log (
    table_name,
    operation,
    user_id,
    accessed_data,
    ip_address
  ) VALUES (
    'payment_methods_secure',
    p_operation,
    p_user_id,
    p_metadata,
    inet_client_addr()
  );
END;
$$;

-- 3. Create secure payment methods display function with complete data masking
CREATE OR REPLACE FUNCTION public.get_secure_payment_display(p_user_id uuid)
RETURNS TABLE(
  id uuid,
  display_text text,
  card_type text,
  is_default boolean,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Comprehensive security checks
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied: Authentication required';
  END IF;
  
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Access denied: Invalid user context';
  END IF;
  
  -- Enhanced rate limiting
  IF NOT public.check_payment_rate_limit(auth.uid(), 'secure_display', 10, 5) THEN
    RAISE EXCEPTION 'Access denied: Rate limit exceeded for security';
  END IF;
  
  -- Log the secure access
  PERFORM public.log_secure_payment_access(
    'SECURE_DISPLAY_ACCESS',
    auth.uid(),
    jsonb_build_object(
      'function', 'get_secure_payment_display',
      'timestamp', now(),
      'security_level', 'maximum'
    )
  );
  
  -- Return completely masked data - no real card details exposed
  RETURN QUERY
  SELECT 
    pm.id,
    CASE 
      WHEN pm.card_brand IS NOT NULL THEN
        UPPER(pm.card_brand) || ' ending in ••••'
      ELSE 
        pm.type || ' payment method'
    END AS display_text,
    COALESCE(pm.card_brand, pm.type) AS card_type,
    pm.is_default,
    pm.created_at
  FROM public.payment_methods pm
  WHERE pm.user_id = p_user_id
  ORDER BY pm.is_default DESC, pm.created_at DESC;
END;
$$;

-- 4. Create service-only function for payment processing (no user access)
CREATE OR REPLACE FUNCTION public.get_payment_method_for_service(
  p_payment_method_id uuid,
  p_operation text
)
RETURNS TABLE(
  id uuid,
  stripe_payment_method_id text,
  user_id uuid,
  type text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only service role can access this function
  IF auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Access denied: Service role required';
  END IF;
  
  -- Log service access
  PERFORM public.log_secure_payment_access(
    'SERVICE_ONLY_ACCESS',
    NULL, -- No user context for service operations
    jsonb_build_object(
      'payment_method_id', p_payment_method_id,
      'operation', p_operation,
      'service_context', true,
      'timestamp', now()
    )
  );
  
  RETURN QUERY
  SELECT 
    pm.id,
    pm.stripe_payment_method_id,
    pm.user_id,
    pm.type
  FROM public.payment_methods pm
  WHERE pm.id = p_payment_method_id;
END;
$$;

-- 5. Enhanced intrusion detection for payment access
CREATE OR REPLACE FUNCTION public.detect_payment_intrusion_enhanced()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  recent_access_count INTEGER;
  suspicious_pattern BOOLEAN := FALSE;
BEGIN
  -- Check for rapid successive access (potential data harvesting)
  SELECT COUNT(*) INTO recent_access_count
  FROM public.payment_audit_log
  WHERE user_id = auth.uid()
    AND created_at > now() - INTERVAL '30 seconds'
    AND operation LIKE '%DISPLAY%';
  
  -- Detect suspicious patterns
  IF recent_access_count > 5 THEN
    suspicious_pattern := TRUE;
  END IF;
  
  -- Log and alert if suspicious
  IF suspicious_pattern THEN
    INSERT INTO public.payment_security_alerts (
      alert_type,
      user_id,
      ip_address,
      attempted_data
    ) VALUES (
      'RAPID_PAYMENT_ACCESS',
      auth.uid(),
      inet_client_addr(),
      jsonb_build_object(
        'access_count', recent_access_count,
        'time_window', '30 seconds',
        'severity', 'HIGH',
        'timestamp', now()
      )
    );
    
    RAISE EXCEPTION 'Security alert: Suspicious payment data access pattern detected';
  END IF;
  
  RETURN NEW;
END;
$$;

-- 6. Add trigger for enhanced intrusion detection
DROP TRIGGER IF EXISTS payment_intrusion_detection_enhanced ON public.payment_audit_log;
CREATE TRIGGER payment_intrusion_detection_enhanced
  AFTER INSERT ON public.payment_audit_log
  FOR EACH ROW
  EXECUTE FUNCTION public.detect_payment_intrusion_enhanced();

-- 7. Revoke all direct SELECT access to payment_methods for users
-- Only service role and secure functions can access the table now
ALTER TABLE public.payment_methods DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_methods TO service_role;
REVOKE ALL ON public.payment_methods FROM authenticated;
REVOKE ALL ON public.payment_methods FROM anon;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Create service-only policy
CREATE POLICY "service_role_only_payment_access" ON public.payment_methods
  FOR ALL USING (auth.role() = 'service_role');

-- 8. Grant execute permissions on secure functions
GRANT EXECUTE ON FUNCTION public.get_secure_payment_display(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_payment_method_for_service(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.log_secure_payment_access(text, uuid, jsonb) TO service_role;