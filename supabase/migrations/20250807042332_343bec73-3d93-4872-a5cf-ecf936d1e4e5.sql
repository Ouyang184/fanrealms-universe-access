-- Fix remaining RLS performance issues

-- Fix email_2fa_codes table policies
DROP POLICY IF EXISTS "Users can view their own 2FA codes" ON public.email_2fa_codes;
CREATE POLICY "Users can view their own 2FA codes" 
ON public.email_2fa_codes 
FOR SELECT 
USING (auth.email() = email);

DROP POLICY IF EXISTS "Users can insert their own 2FA codes" ON public.email_2fa_codes;
CREATE POLICY "Users can insert their own 2FA codes" 
ON public.email_2fa_codes 
FOR INSERT 
WITH CHECK (auth.email() = email);

DROP POLICY IF EXISTS "Users can update their own 2FA codes" ON public.email_2fa_codes;
CREATE POLICY "Users can update their own 2FA codes" 
ON public.email_2fa_codes 
FOR UPDATE 
USING (auth.email() = email);

DROP POLICY IF EXISTS "Users can delete their own 2FA codes" ON public.email_2fa_codes;
CREATE POLICY "Users can delete their own 2FA codes" 
ON public.email_2fa_codes 
FOR DELETE 
USING (auth.email() = email);

-- Fix commission_requests delete policy
DROP POLICY IF EXISTS "Customers can delete their own pending, rejected, or payment_pe" ON public.commission_requests;
CREATE POLICY "Customers can delete their own pending, rejected, or payment_pe" 
ON public.commission_requests 
FOR DELETE 
USING (((SELECT auth.uid()) = customer_id) AND (status = ANY (ARRAY['pending'::text, 'rejected'::text, 'payment_pending'::text])));

-- Fix tags table policies
DROP POLICY IF EXISTS "Authenticated users can suggest tags" ON public.tags;
CREATE POLICY "Authenticated users can suggest tags" 
ON public.tags 
FOR INSERT 
WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Service role can moderate tags" ON public.tags;
CREATE POLICY "Service role can moderate tags" 
ON public.tags 
FOR ALL 
USING ((SELECT auth.role()) = 'service_role'::text);

-- Fix creator_earnings policy
DROP POLICY IF EXISTS "Creators can view their own earnings" ON public.creator_earnings;
CREATE POLICY "Creators can view their own earnings" 
ON public.creator_earnings 
FOR SELECT 
USING (creator_id IN ( SELECT creators.id
   FROM creators
  WHERE (creators.user_id = (SELECT auth.uid()))));

-- Fix creator_ratings policies
DROP POLICY IF EXISTS "Users can create ratings if they have interaction" ON public.creator_ratings;
CREATE POLICY "Users can create ratings if they have interaction" 
ON public.creator_ratings 
FOR INSERT 
WITH CHECK (((SELECT auth.uid()) = user_id) AND ((EXISTS ( SELECT 1
   FROM user_subscriptions us
  WHERE ((us.user_id = (SELECT auth.uid())) AND (us.creator_id = creator_ratings.creator_id) AND (us.status = 'active'::text)))) OR (EXISTS ( SELECT 1
   FROM commission_requests cr
  WHERE ((cr.customer_id = (SELECT auth.uid())) AND (cr.creator_id = creator_ratings.creator_id))))));

DROP POLICY IF EXISTS "Users can update their own ratings" ON public.creator_ratings;
CREATE POLICY "Users can update their own ratings" 
ON public.creator_ratings 
FOR UPDATE 
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own ratings" ON public.creator_ratings;
CREATE POLICY "Users can delete their own ratings" 
ON public.creator_ratings 
FOR DELETE 
USING ((SELECT auth.uid()) = user_id);

-- Consolidate multiple permissive policies for commission_deliverables
DROP POLICY IF EXISTS "Creators can view deliverables for their commissions" ON public.commission_deliverables;
DROP POLICY IF EXISTS "Customers can view deliverables for their requests" ON public.commission_deliverables;
CREATE POLICY "Users can view commission deliverables" 
ON public.commission_deliverables 
FOR SELECT 
USING (
  (commission_request_id IN ( SELECT commission_requests.id
     FROM commission_requests
    WHERE (commission_requests.creator_id IN ( SELECT creators.id
             FROM creators
            WHERE (creators.user_id = (SELECT auth.uid())))))) OR
  (commission_request_id IN ( SELECT commission_requests.id
     FROM commission_requests
    WHERE (commission_requests.customer_id = (SELECT auth.uid()))))
);

-- Consolidate multiple permissive policies for commission_requests SELECT
DROP POLICY IF EXISTS "Creators can view requests for their commissions" ON public.commission_requests;
DROP POLICY IF EXISTS "Customers can view their own requests" ON public.commission_requests;
CREATE POLICY "Users can view commission requests" 
ON public.commission_requests 
FOR SELECT 
USING (
  (creator_id IN ( SELECT creators.id
     FROM creators
    WHERE (creators.user_id = (SELECT auth.uid())))) OR
  ((SELECT auth.uid()) = customer_id)
);

-- Consolidate multiple permissive policies for commission_requests UPDATE
DROP POLICY IF EXISTS "Creators can update requests for their commissions" ON public.commission_requests;
DROP POLICY IF EXISTS "Customers can update their own requests" ON public.commission_requests;
CREATE POLICY "Users can update commission requests" 
ON public.commission_requests 
FOR UPDATE 
USING (
  (creator_id IN ( SELECT creators.id
     FROM creators
    WHERE (creators.user_id = (SELECT auth.uid())))) OR
  ((SELECT auth.uid()) = customer_id)
);

-- Fix commission_types overlapping policies by removing the redundant one
DROP POLICY IF EXISTS "Creators can manage their own commission types" ON public.commission_types;
CREATE POLICY "Creators can manage their own commission types" 
ON public.commission_types 
FOR ALL 
USING (
  (true) OR  -- Anyone can view (covers the "Anyone can view commission types" case)
  (creator_id IN ( SELECT creators.id
     FROM creators
    WHERE (creators.user_id = (SELECT auth.uid()))))  -- Creators can manage their own
)
WITH CHECK (creator_id IN ( SELECT creators.id
   FROM creators
  WHERE (creators.user_id = (SELECT auth.uid()))));

-- Drop the redundant policy since we consolidated it above
DROP POLICY IF EXISTS "Anyone can view commission types" ON public.commission_types;