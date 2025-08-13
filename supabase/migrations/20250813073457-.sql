-- Security hardening migration per plan
-- 1) Ensure RLS is enabled where needed
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_requests ENABLE ROW LEVEL SECURITY;

-- 2) Users: restrict UPDATE to authenticated users on their own row, keep service-role-only INSERT
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
CREATE POLICY "Service role can insert users"
ON public.users
FOR INSERT
TO service_role
WITH CHECK (auth.role() = 'service_role');

-- Optional explicit anonymous deny for clarity
DROP POLICY IF EXISTS "Deny all anonymous access to users" ON public.users;
CREATE POLICY "Deny all anonymous access to users"
ON public.users
FOR ALL
TO anon
USING (false);

-- 3) Messages: explicit role-scoped policies
DROP POLICY IF EXISTS "Deny all anonymous access to messages" ON public.messages;
CREATE POLICY "Deny all anonymous access to messages"
ON public.messages
FOR ALL
TO anon
USING (false);

DROP POLICY IF EXISTS "Participants can select their messages" ON public.messages;
CREATE POLICY "Participants can select their messages"
ON public.messages
FOR SELECT
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Participants can update their messages" ON public.messages;
CREATE POLICY "Participants can update their messages"
ON public.messages
FOR UPDATE
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
WITH CHECK (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Senders can delete their messages" ON public.messages;
CREATE POLICY "Senders can delete their messages"
ON public.messages
FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.messages;
CREATE POLICY "Authenticated users can send messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- 4) Payment methods: explicitly deny anonymous and authenticated mutations; keep service-role mutations and owner SELECT
DROP POLICY IF EXISTS "Deny all anonymous access to payment_methods" ON public.payment_methods;
CREATE POLICY "Deny all anonymous access to payment_methods"
ON public.payment_methods
FOR ALL
TO anon
USING (false);

-- Explicit denials for authenticated mutations (defense-in-depth)
DROP POLICY IF EXISTS "Authenticated users cannot insert payment methods" ON public.payment_methods;
CREATE POLICY "Authenticated users cannot insert payment methods"
ON public.payment_methods
FOR INSERT
TO authenticated
WITH CHECK (false);

DROP POLICY IF EXISTS "Authenticated users cannot update payment methods" ON public.payment_methods;
CREATE POLICY "Authenticated users cannot update payment methods"
ON public.payment_methods
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "Authenticated users cannot delete payment methods" ON public.payment_methods;
CREATE POLICY "Authenticated users cannot delete payment methods"
ON public.payment_methods
FOR DELETE
TO authenticated
USING (false);

-- Keep/ensure select for owners (recreate to be explicit)
DROP POLICY IF EXISTS "Users can view their own payment methods" ON public.payment_methods;
CREATE POLICY "Users can view their own payment methods"
ON public.payment_methods
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 5) Creator earnings: block anonymous and authenticated mutations; allow creator SELECT and service-role INSERT
DROP POLICY IF EXISTS "Deny all anonymous access to creator_earnings" ON public.creator_earnings;
CREATE POLICY "Deny all anonymous access to creator_earnings"
ON public.creator_earnings
FOR ALL
TO anon
USING (false);

DROP POLICY IF EXISTS "Authenticated users cannot insert creator_earnings" ON public.creator_earnings;
CREATE POLICY "Authenticated users cannot insert creator_earnings"
ON public.creator_earnings
FOR INSERT
TO authenticated
WITH CHECK (false);

DROP POLICY IF EXISTS "Authenticated users cannot update creator_earnings" ON public.creator_earnings;
CREATE POLICY "Authenticated users cannot update creator_earnings"
ON public.creator_earnings
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "Authenticated users cannot delete creator_earnings" ON public.creator_earnings;
CREATE POLICY "Authenticated users cannot delete creator_earnings"
ON public.creator_earnings
FOR DELETE
TO authenticated
USING (false);

-- Recreate existing allowed policies for clarity
DROP POLICY IF EXISTS "Authenticated creators can view their own earnings" ON public.creator_earnings;
CREATE POLICY "Authenticated creators can view their own earnings"
ON public.creator_earnings
FOR SELECT
TO authenticated
USING (creator_id IN (
  SELECT c.id FROM public.creators c WHERE c.user_id = auth.uid()
));

DROP POLICY IF EXISTS "Service role can insert earnings" ON public.creator_earnings;
CREATE POLICY "Service role can insert earnings"
ON public.creator_earnings
FOR INSERT
TO service_role
WITH CHECK (auth.role() = 'service_role');

-- 6) Commission requests: explicit anonymous deny (policies for auth already exist)
DROP POLICY IF EXISTS "Deny anonymous access to commission_requests" ON public.commission_requests;
CREATE POLICY "Deny anonymous access to commission_requests"
ON public.commission_requests
FOR ALL
TO anon
USING (false);
