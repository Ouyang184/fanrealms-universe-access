
-- 1) Users: add WITH CHECK and restrict UPDATE to authenticated only
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 2) Messages: explicitly deny anon, and set all access to authenticated only with clear conditions
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Deny all anonymous access
DROP POLICY IF EXISTS "Deny all anonymous access to messages" ON public.messages;
CREATE POLICY "Deny all anonymous access to messages"
ON public.messages
FOR ALL
TO anon
USING (false);

-- Participants can read their messages
DROP POLICY IF EXISTS "Participants can select their messages" ON public.messages;
CREATE POLICY "Participants can select their messages"
ON public.messages
FOR SELECT
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Participants can update their own messages
DROP POLICY IF EXISTS "Participants can update their messages" ON public.messages;
CREATE POLICY "Participants can update their messages"
ON public.messages
FOR UPDATE
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
WITH CHECK (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Senders can delete their messages
DROP POLICY IF EXISTS "Senders can delete their messages" ON public.messages;
CREATE POLICY "Senders can delete their messages"
ON public.messages
FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);

-- Only authenticated users can insert messages (enforce sender_id = auth.uid())
DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.messages;
CREATE POLICY "Authenticated users can send messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- 3) Payment methods: explicitly deny all anonymous access (already safe, this is for clarity)
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny all anonymous access to payment_methods" ON public.payment_methods;
CREATE POLICY "Deny all anonymous access to payment_methods"
ON public.payment_methods
FOR ALL
TO anon
USING (false);
