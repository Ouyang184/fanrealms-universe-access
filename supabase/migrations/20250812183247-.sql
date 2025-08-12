-- Harden RLS for stripe_customers without breaking edge functions
ALTER TABLE IF EXISTS public.stripe_customers ENABLE ROW LEVEL SECURITY;

-- Remove existing policies to avoid duplicates
DROP POLICY IF EXISTS "Users can view their own stripe customer data" ON public.stripe_customers;
DROP POLICY IF EXISTS "Users can insert their own stripe customer data" ON public.stripe_customers;
DROP POLICY IF EXISTS "Users can manage their own stripe customer data" ON public.stripe_customers;
DROP POLICY IF EXISTS "Service role can manage stripe customers" ON public.stripe_customers;
DROP POLICY IF EXISTS "Insert stripe customers" ON public.stripe_customers;
DROP POLICY IF EXISTS "Update stripe customers" ON public.stripe_customers;
DROP POLICY IF EXISTS "Delete stripe customers" ON public.stripe_customers;

-- Read: only the authenticated owner can read their own stripe customer mapping
CREATE POLICY "Users can view their own stripe customer data"
ON public.stripe_customers
FOR SELECT
USING (auth.uid() = user_id);

-- Insert: only service role (edge functions) can insert
CREATE POLICY "Service role can insert stripe customers"
ON public.stripe_customers
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Update: only service role can update
CREATE POLICY "Service role can update stripe customers"
ON public.stripe_customers
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Delete: only service role can delete
CREATE POLICY "Service role can delete stripe customers"
ON public.stripe_customers
FOR DELETE
USING (auth.role() = 'service_role');
