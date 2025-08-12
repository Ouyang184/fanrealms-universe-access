-- Tighten RLS on payment_methods to restrict SELECT to owners and writes to service role only
DROP POLICY IF EXISTS "Manage payment methods" ON public.payment_methods;

-- Read: only the authenticated owner can read their rows
CREATE POLICY "Users can view their own payment methods"
ON public.payment_methods
FOR SELECT
USING (auth.uid() = user_id);

-- Insert: only service role can write (edge functions)
CREATE POLICY "Service role can insert payment methods"
ON public.payment_methods
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Update: only service role can update
CREATE POLICY "Service role can update payment methods"
ON public.payment_methods
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Delete: only service role can delete
CREATE POLICY "Service role can delete payment methods"
ON public.payment_methods
FOR DELETE
USING (auth.role() = 'service_role');