
-- Fix RLS policies for messaging functionality

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can read their own messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
DROP POLICY IF EXISTS "Users can read their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can manage their conversations" ON conversation_participants;

-- Create more permissive policies for messages
CREATE POLICY "Users can read messages they sent or received" ON messages
FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

CREATE POLICY "Users can send messages" ON messages
FOR INSERT WITH CHECK (
  auth.uid() = sender_id
);

CREATE POLICY "Users can update their received messages" ON messages
FOR UPDATE USING (
  auth.uid() = receiver_id
) WITH CHECK (
  auth.uid() = receiver_id
);

-- Create policies for conversation_participants
CREATE POLICY "Users can read their conversation participants" ON conversation_participants
FOR SELECT USING (
  auth.uid() = user_id
);

CREATE POLICY "Users can create conversation participants" ON conversation_participants
FOR INSERT WITH CHECK (
  auth.uid() = user_id OR auth.uid() = other_user_id
);

CREATE POLICY "Users can update their conversation participants" ON conversation_participants
FOR UPDATE USING (
  auth.uid() = user_id
) WITH CHECK (
  auth.uid() = user_id
);
