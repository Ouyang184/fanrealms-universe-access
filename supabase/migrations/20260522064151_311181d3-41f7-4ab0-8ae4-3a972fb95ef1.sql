
-- Revoke client-role SELECT on Stripe identifier columns to enforce zero-knowledge Stripe contract
REVOKE SELECT (stripe_payment_intent_id) ON public.commission_requests FROM anon, authenticated;
REVOKE SELECT (stripe_payment_intent_id) ON public.commission_revisions FROM anon, authenticated;
REVOKE SELECT (stripe_price_id) ON public.digital_products FROM anon, authenticated;
REVOKE SELECT (stripe_session_id, stripe_payment_intent_id) ON public.purchases FROM anon, authenticated;

-- Tighten realtime topic policy: replace substring LIKE with exact prefix match
DROP POLICY IF EXISTS "Users can subscribe to their own realtime topics" ON realtime.messages;
CREATE POLICY "Users can subscribe to their own realtime topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (realtime.topic() = ('user:' || (auth.uid())::text) OR realtime.topic() LIKE ('user:' || (auth.uid())::text || ':%'));
