
-- Add the missing trigger to automatically create user records when auth users sign up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_simple();

-- Handle existing users more carefully to avoid username conflicts
-- First, let's see what usernames are already taken and create unique ones
INSERT INTO public.users (id, email, username, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.users WHERE username = COALESCE(au.raw_user_meta_data->>'username', LEFT(au.email, POSITION('@' IN au.email) - 1)))
    THEN COALESCE(au.raw_user_meta_data->>'username', LEFT(au.email, POSITION('@' IN au.email) - 1)) || '_' || EXTRACT(EPOCH FROM NOW())::text
    ELSE COALESCE(au.raw_user_meta_data->>'username', LEFT(au.email, POSITION('@' IN au.email) - 1))
  END,
  NOW(),
  NOW()
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;
