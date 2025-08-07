-- Fix RLS performance issues by optimizing auth function calls

-- Fix follows table policies
DROP POLICY IF EXISTS "Authenticated users can create follows" ON public.follows;
CREATE POLICY "Authenticated users can create follows" 
ON public.follows 
FOR INSERT 
WITH CHECK (((SELECT auth.uid()) = user_id) AND ((SELECT auth.uid()) IS NOT NULL));

DROP POLICY IF EXISTS "Users can delete their own follows" ON public.follows;
CREATE POLICY "Users can delete their own follows" 
ON public.follows 
FOR DELETE 
USING ((SELECT auth.uid()) = user_id);

-- Fix commission_requests table policies
DROP POLICY IF EXISTS "Creators can view requests for their commissions" ON public.commission_requests;
CREATE POLICY "Creators can view requests for their commissions" 
ON public.commission_requests 
FOR SELECT 
USING (creator_id IN ( SELECT creators.id
   FROM creators
  WHERE (creators.user_id = (SELECT auth.uid()))));

DROP POLICY IF EXISTS "Customers can create requests" ON public.commission_requests;
CREATE POLICY "Customers can create requests" 
ON public.commission_requests 
FOR INSERT 
WITH CHECK ((SELECT auth.uid()) = customer_id);

-- Fix payment_methods table policy
DROP POLICY IF EXISTS "Service role can manage all payment methods" ON public.payment_methods;
CREATE POLICY "Service role can manage all payment methods" 
ON public.payment_methods 
FOR ALL 
USING ((SELECT auth.role()) = 'service_role'::text);

-- Fix commission_types table policy
DROP POLICY IF EXISTS "Creators can manage their own commission types" ON public.commission_types;
CREATE POLICY "Creators can manage their own commission types" 
ON public.commission_types 
FOR ALL 
USING (creator_id IN ( SELECT creators.id
   FROM creators
  WHERE (creators.user_id = (SELECT auth.uid()))))
WITH CHECK (creator_id IN ( SELECT creators.id
   FROM creators
  WHERE (creators.user_id = (SELECT auth.uid()))));

-- Also fix other auth.uid() calls in remaining policies for better performance
DROP POLICY IF EXISTS "Customers can update their own requests" ON public.commission_requests;
CREATE POLICY "Customers can update their own requests" 
ON public.commission_requests 
FOR UPDATE 
USING ((SELECT auth.uid()) = customer_id);

DROP POLICY IF EXISTS "Customers can view their own requests" ON public.commission_requests;
CREATE POLICY "Customers can view their own requests" 
ON public.commission_requests 
FOR SELECT 
USING ((SELECT auth.uid()) = customer_id);

DROP POLICY IF EXISTS "Creators can update requests for their commissions" ON public.commission_requests;
CREATE POLICY "Creators can update requests for their commissions" 
ON public.commission_requests 
FOR UPDATE 
USING (creator_id IN ( SELECT creators.id
   FROM creators
  WHERE (creators.user_id = (SELECT auth.uid()))));

-- Fix commission_deliverables policies
DROP POLICY IF EXISTS "Creators can create deliverables for their commissions" ON public.commission_deliverables;
CREATE POLICY "Creators can create deliverables for their commissions" 
ON public.commission_deliverables 
FOR INSERT 
WITH CHECK (commission_request_id IN ( SELECT commission_requests.id
   FROM commission_requests
  WHERE (commission_requests.creator_id IN ( SELECT creators.id
           FROM creators
          WHERE (creators.user_id = (SELECT auth.uid()))))));

DROP POLICY IF EXISTS "Creators can update deliverables for their commissions" ON public.commission_deliverables;
CREATE POLICY "Creators can update deliverables for their commissions" 
ON public.commission_deliverables 
FOR UPDATE 
USING (commission_request_id IN ( SELECT commission_requests.id
   FROM commission_requests
  WHERE (commission_requests.creator_id IN ( SELECT creators.id
           FROM creators
          WHERE (creators.user_id = (SELECT auth.uid()))))));

DROP POLICY IF EXISTS "Creators can view deliverables for their commissions" ON public.commission_deliverables;
CREATE POLICY "Creators can view deliverables for their commissions" 
ON public.commission_deliverables 
FOR SELECT 
USING (commission_request_id IN ( SELECT commission_requests.id
   FROM commission_requests
  WHERE (commission_requests.creator_id IN ( SELECT creators.id
           FROM creators
          WHERE (creators.user_id = (SELECT auth.uid()))))));

DROP POLICY IF EXISTS "Customers can view deliverables for their requests" ON public.commission_deliverables;
CREATE POLICY "Customers can view deliverables for their requests" 
ON public.commission_deliverables 
FOR SELECT 
USING (commission_request_id IN ( SELECT commission_requests.id
   FROM commission_requests
  WHERE (commission_requests.customer_id = (SELECT auth.uid()))));

-- Fix payment_methods user policies
DROP POLICY IF EXISTS "Users can delete their own payment methods" ON public.payment_methods;
CREATE POLICY "Users can delete their own payment methods" 
ON public.payment_methods 
FOR DELETE 
USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own payment methods" ON public.payment_methods;
CREATE POLICY "Users can insert their own payment methods" 
ON public.payment_methods 
FOR INSERT 
WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own payment methods" ON public.payment_methods;
CREATE POLICY "Users can update their own payment methods" 
ON public.payment_methods 
FOR UPDATE 
USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own payment methods" ON public.payment_methods;
CREATE POLICY "Users can view their own payment methods" 
ON public.payment_methods 
FOR SELECT 
USING ((SELECT auth.uid()) = user_id);