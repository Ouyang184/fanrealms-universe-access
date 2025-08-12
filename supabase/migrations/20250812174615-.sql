-- 1) Tighten RLS for user_subscriptions (service role only for ALL)
DROP POLICY IF EXISTS "Service role can modify" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Service role manages all subscriptions" ON public.user_subscriptions;

CREATE POLICY "service role can modify subscriptions"
ON public.user_subscriptions
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Keep existing user policies (INSERT/UPDATE/SELECT using auth.uid() = user_id)

-- 2) Lock down notifications INSERT to service role only
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "service role can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Existing user policies for SELECT/UPDATE/DELETE remain

-- 3) Restrict conversation_participants INSERT to the authenticated user
DROP POLICY IF EXISTS "Users can manage conversations - Insert" ON public.conversation_participants;

CREATE POLICY "Users can create their own conversation participants"
ON public.conversation_participants
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Existing SELECT/UPDATE/DELETE policies remain

-- 4) Make post-attachments bucket private and add owner-only policies
UPDATE storage.buckets SET public = false WHERE id = 'post-attachments';

-- Owner-only access based on first folder = user id
CREATE POLICY IF NOT EXISTS "Owners can manage their own post attachments"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'post-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'post-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5) Create a simple rate limit events table for 2FA endpoints
CREATE TABLE IF NOT EXISTS public.rate_limit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip text NOT NULL,
  email text,
  action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rate_limit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "service role can manage rate limits"
ON public.rate_limit_events
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_rate_limit_events_action_created_at ON public.rate_limit_events (action, created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_events_email_created_at ON public.rate_limit_events (email, created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_events_ip_created_at ON public.rate_limit_events (ip, created_at);
