
ALTER POLICY "Customers can create requests" ON public.commission_requests
  WITH CHECK (
    auth.uid() = customer_id
    AND status = 'pending'
    AND stripe_payment_intent_id IS NULL
    AND (platform_fee_amount IS NULL OR platform_fee_amount = 0)
    AND revision_count = 0
  );

ALTER POLICY "Authenticated users can create threads" ON public.forum_threads
  WITH CHECK (
    author_id = auth.uid()
    AND is_pinned = false
    AND is_locked = false
    AND view_count = 0
    AND reply_count = 0
  );
