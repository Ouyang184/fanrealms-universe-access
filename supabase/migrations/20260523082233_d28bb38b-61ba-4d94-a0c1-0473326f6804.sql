DROP POLICY IF EXISTS "Users can subscribe to their own realtime topics" ON realtime.messages;

CREATE POLICY "Users can subscribe to their own realtime topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = ('user:' || auth.uid()::text)
  OR starts_with(realtime.topic(), 'user:' || auth.uid()::text || ':')
);