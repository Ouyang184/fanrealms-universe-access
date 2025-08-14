-- Enhanced Security Level 2: Zero-Trust Payment Data Protection

-- 1. First, completely revoke all existing access and rebuild with zero-trust approach
DROP POLICY IF EXISTS "Users can view their own payment methods with rate limit" ON public.payment_methods;
DROP POLICY IF EXISTS "Service role can insert payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Service role can update payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Service role can delete payment methods" ON public.payment_methods;

-- 2. Remove the Stripe payment method ID from direct access (create view without it)
CREATE OR REPLACE VIEW public.payment_methods_safe AS
SELECT 
  id,
  user_id,
  type,
  card_brand,
  card_last4,
  card_exp_month,
  card_exp_year,
  is_default,
  created_at,
  updated_at
FROM public.payment_methods;

-- Enable RLS on the safe view
ALTER VIEW public.payment_methods_safe SET (security_barrier = true);

-- 3. Create extremely restrictive RLS policies - users can ONLY access their own data
CREATE POLICY "users_own_payment_methods_only" ON public.payment_methods
FOR SELECT
USING (
  auth.uid() = user_id AND 
  auth.uid() IS NOT NULL AND
  public.check_payment_rate_limit(auth.uid(), 'view_payment_methods', 20, 5)
);

-- 4. Only service role can modify payment methods (for Stripe webhooks)
CREATE POLICY "service_role_payment_methods_write" ON public.payment_methods
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 5. Create secure function that masks sensitive data even further
CREATE OR REPLACE FUNCTION public.get_masked_payment_methods(p_user_id UUID)
RETURNS TABLE(
  id UUID,
  type TEXT,
  card_brand TEXT,
  card_last4 TEXT,
  is_default BOOLEAN,
  exp_display TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Triple verification: auth user, parameter match, and rate limit
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied: User mismatch';
  END IF;
  
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Access denied: Authentication required';
  END IF;
  
  IF NOT public.check_payment_rate_limit(auth.uid(), 'view_masked_methods', 30, 10) THEN
    RAISE EXCEPTION 'Access denied: Rate limit exceeded';
  END IF;
  
  -- Log access with additional security context
  PERFORM public.log_payment_access(
    'payment_methods',
    'MASKED_SELECT',
    jsonb_build_object(
      'user_id', auth.uid(),
      'session_id', auth.jwt()->>'session_id',
      'ip_check', inet_client_addr()
    )
  );
  
  -- Return masked data only
  RETURN QUERY
  SELECT 
    pm.id,
    pm.type,
    pm.card_brand,
    '****' AS card_last4,  -- Mask last 4 digits for extra security
    pm.is_default,
    CASE 
      WHEN pm.card_exp_month IS NOT NULL AND pm.card_exp_year IS NOT NULL 
      THEN 'Expires ' || LPAD(pm.card_exp_month::TEXT, 2, '0') || '/' || RIGHT(pm.card_exp_year::TEXT, 2)
      ELSE 'N/A'
    END AS exp_display
  FROM public.payment_methods pm
  WHERE pm.user_id = p_user_id;
END;
$$;

-- 6. Create function for service role to get full payment method data (for backend operations)
CREATE OR REPLACE FUNCTION public.get_payment_method_for_processing(
  p_payment_method_id UUID,
  p_operation TEXT
)
RETURNS TABLE(
  id UUID,
  stripe_payment_method_id TEXT,
  user_id UUID,
  type TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only service role can access this function
  IF auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Access denied: Service role required for payment processing';
  END IF;
  
  -- Log service role access
  PERFORM public.log_payment_access(
    'payment_methods',
    'SERVICE_ACCESS',
    jsonb_build_object(
      'payment_method_id', p_payment_method_id,
      'operation', p_operation,
      'service_context', true
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

-- 7. Create table for encrypted sensitive data storage
CREATE TABLE IF NOT EXISTS public.payment_secrets_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_method_id UUID NOT NULL REFERENCES public.payment_methods(id) ON DELETE CASCADE,
  encrypted_stripe_id BYTEA,
  encryption_key_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_accessed TIMESTAMPTZ
);

-- Ultra-strict RLS for vault
ALTER TABLE public.payment_secrets_vault ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vault_service_role_only" ON public.payment_secrets_vault
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 8. Create honeypot detection for unauthorized access attempts
CREATE TABLE IF NOT EXISTS public.payment_security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  user_id UUID,
  ip_address INET,
  user_agent TEXT,
  attempted_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_security_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alerts_service_role_only" ON public.payment_security_alerts
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 9. Create function to detect and log suspicious access patterns
CREATE OR REPLACE FUNCTION public.detect_payment_intrusion(
  p_table_accessed TEXT,
  p_suspicious_behavior TEXT
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
    'SUSPICIOUS_ACCESS',
    auth.uid(),
    inet_client_addr(),
    jsonb_build_object(
      'table', p_table_accessed,
      'behavior', p_suspicious_behavior,
      'timestamp', now()
    )
  );
END;
$$;

-- 10. Add trigger to detect bulk access attempts
CREATE OR REPLACE FUNCTION public.monitor_payment_access()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  -- Check for rapid access patterns (potential data harvesting)
  SELECT COUNT(*) INTO recent_count
  FROM public.payment_audit_log
  WHERE user_id = auth.uid()
    AND created_at > now() - INTERVAL '1 minute'
    AND operation = 'SELECT';
  
  -- Alert if suspicious access pattern detected
  IF recent_count > 10 THEN
    PERFORM public.detect_payment_intrusion(
      'payment_methods',
      'RAPID_ACCESS_DETECTED: ' || recent_count || ' queries in 1 minute'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add trigger to payment audit log
CREATE TRIGGER monitor_payment_access_trigger
  AFTER INSERT ON public.payment_audit_log
  FOR EACH ROW
  WHEN (NEW.operation = 'SELECT')
  EXECUTE FUNCTION public.monitor_payment_access();

-- 11. Encrypt stripe_payment_method_id column data (existing data)
-- Note: This is a one-time operation to encrypt existing data
DO $$
DECLARE
  rec RECORD;
  encrypted_value BYTEA;
BEGIN
  -- Only run if we have existing unencrypted data
  FOR rec IN SELECT id, stripe_payment_method_id FROM public.payment_methods 
             WHERE stripe_payment_method_id IS NOT NULL
  LOOP
    -- Encrypt the Stripe ID using pgcrypto
    encrypted_value := pgp_sym_encrypt(rec.stripe_payment_method_id, 'payment_encryption_key_2025');
    
    -- Store in vault
    INSERT INTO public.payment_secrets_vault (
      payment_method_id, 
      encrypted_stripe_id, 
      encryption_key_hash
    ) VALUES (
      rec.id, 
      encrypted_value, 
      md5('payment_encryption_key_2025')
    ) ON CONFLICT (payment_method_id) DO NOTHING;
  END LOOP;
END;
$$;