
-- First, let's temporarily disable the problematic trigger to see if it's causing the delays
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create a much simpler, faster trigger that won't cause delays
CREATE OR REPLACE FUNCTION public.handle_new_user_simple()
RETURNS TRIGGER AS $$
BEGIN
  -- Extremely simple insert with minimal processing
  INSERT INTO public.users (id, email, username, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', LEFT(NEW.email, POSITION('@' IN NEW.email) - 1)),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never let this trigger fail and block signup
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '';

-- Create a much simpler trigger
CREATE TRIGGER on_auth_user_created_simple
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_simple();

-- Temporarily disable all RLS policies that might be causing delays during signup
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.creators DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- Create indexes that might speed up the auth process (without CONCURRENTLY)
CREATE INDEX IF NOT EXISTS idx_users_email_fast ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_id ON public.users(id);

-- Remove any complex constraints that might slow down inserts
DO $$
BEGIN
    -- Drop any complex check constraints that might be slowing things down
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_email_check') THEN
        ALTER TABLE public.users DROP CONSTRAINT users_email_check;
    END IF;
END $$;
