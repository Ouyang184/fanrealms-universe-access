
-- Add platform fee tracking to commission_requests table
ALTER TABLE public.commission_requests 
ADD COLUMN platform_fee_amount NUMERIC DEFAULT 0;

-- Add commission type to creator_earnings to distinguish from subscription earnings
ALTER TABLE public.creator_earnings 
ADD COLUMN earning_type TEXT DEFAULT 'subscription' CHECK (earning_type IN ('subscription', 'commission'));

-- Add commission_request_id to creator_earnings for linking
ALTER TABLE public.creator_earnings 
ADD COLUMN commission_request_id UUID REFERENCES public.commission_requests(id) ON DELETE SET NULL;

-- Update creator_earnings RLS policies to include commission earnings
DROP POLICY IF EXISTS "Creators can view their own earnings" ON public.creator_earnings;
CREATE POLICY "Creators can view their own earnings" 
  ON public.creator_earnings 
  FOR SELECT 
  USING (creator_id IN (
    SELECT id FROM public.creators WHERE user_id = auth.uid()
  ));

-- Allow service role to insert commission earnings
CREATE POLICY "Service role can insert earnings" 
  ON public.creator_earnings 
  FOR INSERT 
  WITH CHECK (true);
