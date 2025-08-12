-- Restrict messaging so only followers can DM creators (and creators can reply to followers)
-- Replace broad insert policy on public.messages
DROP POLICY IF EXISTS "Users can insert own messages" ON public.messages;

CREATE POLICY "Followers<->Creators can send messages when following"
ON public.messages
FOR INSERT
WITH CHECK (
  -- Follower sending to a creator they follow
  (
    auth.uid() = sender_id AND EXISTS (
      SELECT 1
      FROM public.creators c
      JOIN public.follows f ON f.creator_id = c.id
      WHERE c.user_id = receiver_id
        AND f.user_id = auth.uid()
    )
  )
  OR
  -- Creator replying to a follower (who follows this creator)
  (
    auth.uid() = sender_id AND EXISTS (
      SELECT 1
      FROM public.creators c
      JOIN public.follows f ON f.creator_id = c.id
      WHERE c.user_id = auth.uid()
        AND f.user_id = receiver_id
    )
  )
);

-- Keep existing SELECT/UPDATE/DELETE participant-only policies intact