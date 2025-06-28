
-- Ensure the trigger exists and is working properly
-- First drop the trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the trigger to automatically create user records when auth users sign up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_simple();

-- Handle existing auth users who don't have records in public.users
-- Use ON CONFLICT to handle both id and email conflicts gracefully
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
WHERE au.id NOT IN (SELECT id FROM public.users WHERE id IS NOT NULL)
  AND au.email NOT IN (SELECT email FROM public.users WHERE email IS NOT NULL)
ON CONFLICT (id) DO NOTHING;
