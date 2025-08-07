-- Fix remaining multiple permissive policies for payment_methods

-- Consolidate payment_methods policies by removing service role redundancy
-- The service role policy covers all operations, so we can simplify this
DROP POLICY IF EXISTS "Service role can manage all payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Users can delete their own payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Users can insert their own payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Users can update their own payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Users can view their own payment methods" ON public.payment_methods;

-- Create consolidated policies that handle both service role and user access
CREATE POLICY "Manage payment methods" 
ON public.payment_methods 
FOR ALL 
USING (
  ((SELECT auth.role()) = 'service_role'::text) OR 
  ((SELECT auth.uid()) = user_id)
)
WITH CHECK (
  ((SELECT auth.role()) = 'service_role'::text) OR 
  ((SELECT auth.uid()) = user_id)
);