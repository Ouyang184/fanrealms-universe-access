
DROP POLICY IF EXISTS "Creators can create deliverables for their commissions" ON public.commission_deliverables;
DROP POLICY IF EXISTS "Creators can update deliverables for their commissions" ON public.commission_deliverables;
DROP POLICY IF EXISTS "Commission participants can view deliverables" ON public.commission_deliverables;

CREATE POLICY "Creators can create deliverables for their commissions"
ON public.commission_deliverables
FOR INSERT
TO authenticated
WITH CHECK (commission_request_id IN (
  SELECT cr.id FROM commission_requests cr
  WHERE cr.creator_id IN (SELECT c.id FROM creators c WHERE c.user_id = auth.uid())
));

CREATE POLICY "Creators can update deliverables for their commissions"
ON public.commission_deliverables
FOR UPDATE
TO authenticated
USING (commission_request_id IN (
  SELECT cr.id FROM commission_requests cr
  WHERE cr.creator_id IN (SELECT c.id FROM creators c WHERE c.user_id = auth.uid())
));

CREATE POLICY "Commission participants can view deliverables"
ON public.commission_deliverables
FOR SELECT
TO authenticated
USING (commission_request_id IN (
  SELECT cr.id FROM commission_requests cr
  WHERE cr.customer_id = auth.uid()
     OR cr.creator_id IN (SELECT c.id FROM creators c WHERE c.user_id = auth.uid())
));
