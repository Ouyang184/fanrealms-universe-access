
-- Create the missing user record with a unique username
INSERT INTO public.users (id, email, username, created_at, updated_at)
VALUES (
  '3be4ae81-cf68-453c-a04b-c62b4dd5f904',
  (SELECT email FROM auth.users WHERE id = '3be4ae81-cf68-453c-a04b-c62b4dd5f904'),
  'user_' || EXTRACT(EPOCH FROM NOW())::text,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;
