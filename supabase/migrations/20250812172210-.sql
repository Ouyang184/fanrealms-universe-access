-- Revert messaging restriction to allow DMs to any user
-- 1) Drop the follower<->creator-only INSERT policy
DROP POLICY IF EXISTS "Followers<->Creators can send messages when following" ON public.messages;

-- 2) Create a simple INSERT policy allowing any authenticated user to send messages
CREATE POLICY "Authenticated users can send messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- Leave existing SELECT/UPDATE/DELETE policies unchanged