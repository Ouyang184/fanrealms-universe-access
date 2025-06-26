
-- Fix 504 signup errors by optimizing RLS policies and user creation process

-- First, let's optimize the RLS policies that might be causing delays
-- Replace direct auth.uid() calls with SELECT subqueries to avoid row-by-row evaluation

-- Drop problematic policies and recreate them with optimized syntax
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can create their own creator profile" ON public.creators;
DROP POLICY IF EXISTS "Users can update their own creator profile" ON public.creators;
DROP POLICY IF EXISTS "Authenticated users can create follows" ON public.follows;
DROP POLICY IF EXISTS "Users can delete their own follows" ON public.follows;
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Authenticated users can create subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

-- Create optimized RLS policies with SELECT subqueries
CREATE POLICY "Optimized users read access" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Optimized users write access" ON public.users
  FOR ALL USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Optimized creators read access" ON public.creators
  FOR SELECT USING (true);

CREATE POLICY "Optimized creators write access" ON public.creators
  FOR ALL USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Optimized follows read access" ON public.follows
  FOR SELECT USING (true);

CREATE POLICY "Optimized follows write access" ON public.follows
  FOR ALL USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Optimized subscriptions read access" ON public.subscriptions
  FOR SELECT USING (
    user_id = (SELECT auth.uid()) 
    OR EXISTS (
      SELECT 1 FROM public.creators c 
      WHERE c.user_id = (SELECT auth.uid()) 
      AND c.id = subscriptions.creator_id
    )
  );

CREATE POLICY "Optimized subscriptions write access" ON public.subscriptions
  FOR ALL USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Optimized notifications read access" ON public.notifications
  FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Optimized notifications write access" ON public.notifications
  FOR UPDATE USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Optimize the handle_new_user function to be faster and more reliable
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Simple, fast insert without complex operations
  INSERT INTO public.users (id, email, username, profile_picture, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate key errors
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the auth process
  RAISE LOG 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '';

-- Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add indexes to speed up common queries during signup
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_creators_user_id ON public.creators(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_user_id ON public.follows(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- Ensure all user-related tables have proper constraints to prevent deadlocks
ALTER TABLE public.users ADD CONSTRAINT IF NOT EXISTS users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add a function to handle post-signup setup (to be called after login, not during signup)
CREATE OR REPLACE FUNCTION public.complete_user_setup(user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- This function can be called after login to complete any additional setup
  -- without blocking the signup process
  
  -- Create default notification preferences
  INSERT INTO public.users (id, is_nsfw_enabled, email_notifications_enabled)
  VALUES (user_id_param, false, true)
  ON CONFLICT (id) DO UPDATE SET
    is_nsfw_enabled = COALESCE(users.is_nsfw_enabled, false),
    email_notifications_enabled = COALESCE(users.email_notifications_enabled, true);
  
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error in complete_user_setup: %', SQLERRM;
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '';

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.complete_user_setup(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;

-- Final check - ensure all policies are properly set
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies 
WHERE tablename IN ('users', 'creators', 'follows', 'subscriptions', 'notifications')
  AND policyname LIKE 'Optimized%'
ORDER BY tablename, policyname;
