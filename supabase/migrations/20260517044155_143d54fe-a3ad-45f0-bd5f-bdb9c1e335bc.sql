
-- 1. Commission requests: restrict customer updates to safe fields only
DROP POLICY IF EXISTS "Users can update commission requests" ON public.commission_requests;

CREATE POLICY "Creators can update their commission requests"
ON public.commission_requests
FOR UPDATE
TO authenticated
USING (
  creator_id IN (SELECT c.id FROM public.creators c WHERE c.user_id = auth.uid())
)
WITH CHECK (
  creator_id IN (SELECT c.id FROM public.creators c WHERE c.user_id = auth.uid())
);

CREATE POLICY "Customers can update limited fields on their requests"
ON public.commission_requests
FOR UPDATE
TO authenticated
USING (customer_id = auth.uid())
WITH CHECK (
  customer_id = auth.uid()
  AND creator_id = (SELECT creator_id FROM public.commission_requests cr WHERE cr.id = commission_requests.id)
  AND customer_id = (SELECT customer_id FROM public.commission_requests cr WHERE cr.id = commission_requests.id)
  AND commission_type_id = (SELECT commission_type_id FROM public.commission_requests cr WHERE cr.id = commission_requests.id)
  AND status IS NOT DISTINCT FROM (SELECT status FROM public.commission_requests cr WHERE cr.id = commission_requests.id)
  AND agreed_price IS NOT DISTINCT FROM (SELECT agreed_price FROM public.commission_requests cr WHERE cr.id = commission_requests.id)
  AND stripe_payment_intent_id IS NOT DISTINCT FROM (SELECT stripe_payment_intent_id FROM public.commission_requests cr WHERE cr.id = commission_requests.id)
  AND platform_fee_amount IS NOT DISTINCT FROM (SELECT platform_fee_amount FROM public.commission_requests cr WHERE cr.id = commission_requests.id)
  AND revision_count IS NOT DISTINCT FROM (SELECT revision_count FROM public.commission_requests cr WHERE cr.id = commission_requests.id)
);

-- 2. Product ratings: require completed purchase
DROP POLICY IF EXISTS product_ratings_insert ON public.product_ratings;
DROP POLICY IF EXISTS product_ratings_update ON public.product_ratings;

CREATE POLICY product_ratings_insert
ON public.product_ratings
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.purchases p
    WHERE p.buyer_id = auth.uid()
      AND p.product_id = product_ratings.product_id
      AND p.status = 'completed'
  )
);

CREATE POLICY product_ratings_update
ON public.product_ratings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.purchases p
    WHERE p.buyer_id = auth.uid()
      AND p.product_id = product_ratings.product_id
      AND p.status = 'completed'
  )
);

-- 3. Product files storage: tighten creator branch so a creator can only read files for their own products
DROP POLICY IF EXISTS "Creators and buyers can read product files" ON storage.objects;

CREATE POLICY "Creators and buyers can read product files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'product-files'
  AND (
    EXISTS (
      SELECT 1 FROM public.digital_products dp
      JOIN public.creators c ON c.id = dp.creator_id
      WHERE c.user_id = auth.uid()
        AND (c.id)::text = (string_to_array(name, '/'))[1]
        AND (dp.id)::text = (string_to_array(name, '/'))[2]
    )
    OR EXISTS (
      SELECT 1 FROM public.purchases pu
      JOIN public.digital_products dp ON dp.id = pu.product_id
      WHERE pu.buyer_id = auth.uid()
        AND pu.status = 'completed'
        AND (pu.product_id)::text = (string_to_array(objects.name, '/'))[2]
        AND (dp.creator_id)::text = (string_to_array(objects.name, '/'))[1]
    )
  )
);
