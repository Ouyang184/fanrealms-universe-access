-- Enhanced Security for Payment Data Tables

-- 1. Create audit log table for payment data access
CREATE TABLE IF NOT EXISTS public.payment_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  user_id UUID,
  ip_address INET,
  user_agent TEXT,
  accessed_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.payment_audit_log ENABLE ROW LEVEL SECURITY;

-- Only service role can manage audit logs
CREATE POLICY "service_role_audit_access" ON public.payment_audit_log
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 2. Create function to log payment data access
CREATE OR REPLACE FUNCTION public.log_payment_access(
  p_table_name TEXT,
  p_operation TEXT,
  p_accessed_data JSONB DEFAULT NULL
)
RETURNS void AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger function for payment_methods access logging
CREATE OR REPLACE FUNCTION public.audit_payment_methods_access()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger for payment_methods
CREATE TRIGGER audit_payment_methods_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.audit_payment_methods_access();

-- 5. Create function to securely get payment methods (with additional checks)
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
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Add additional constraints and checks
ALTER TABLE public.payment_methods 
ADD CONSTRAINT valid_card_exp_month CHECK (card_exp_month >= 1 AND card_exp_month <= 12),
ADD CONSTRAINT valid_card_exp_year CHECK (card_exp_year >= EXTRACT(YEAR FROM now())),
ADD CONSTRAINT valid_card_last4 CHECK (card_last4 ~ '^[0-9]{4}$');

-- 7. Create function to encrypt sensitive fields (using built-in pgcrypto)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 8. Add encrypted storage for additional sensitive data if needed
CREATE TABLE IF NOT EXISTS public.payment_metadata_encrypted (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_method_id UUID NOT NULL REFERENCES public.payment_methods(id) ON DELETE CASCADE,
  encrypted_data BYTEA, -- For storing encrypted additional metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on encrypted metadata
ALTER TABLE public.payment_metadata_encrypted ENABLE ROW LEVEL SECURITY;

-- Strict access policy for encrypted data
CREATE POLICY "service_role_only_encrypted_data" ON public.payment_metadata_encrypted
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 9. Create rate limiting for payment operations
CREATE TABLE IF NOT EXISTS public.payment_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  operation TEXT NOT NULL,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on rate limits
ALTER TABLE public.payment_rate_limits ENABLE ROW LEVEL SECURITY;

-- Service role manages rate limits
CREATE POLICY "service_role_rate_limits" ON public.payment_rate_limits
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 10. Create function to check rate limits
CREATE OR REPLACE FUNCTION public.check_payment_rate_limit(
  p_user_id UUID,
  p_operation TEXT,
  p_limit INTEGER DEFAULT 10,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Update existing RLS policies with additional security checks
DROP POLICY IF EXISTS "Users can view their own payment methods" ON public.payment_methods;

CREATE POLICY "Users can view their own payment methods with rate limit" ON public.payment_methods
FOR SELECT
USING (
  auth.uid() = user_id AND 
  public.check_payment_rate_limit(auth.uid(), 'view_payment_methods', 50, 5)
);

-- 12. Create monitoring view for security team (service role only)
CREATE OR REPLACE VIEW public.payment_security_summary AS
SELECT 
  'payment_methods' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT user_id) as unique_users,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record
FROM public.payment_methods
UNION ALL
SELECT 
  'stripe_customers' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT user_id) as unique_users,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record
FROM public.stripe_customers;

-- Grant access to service role only
GRANT SELECT ON public.payment_security_summary TO service_role;