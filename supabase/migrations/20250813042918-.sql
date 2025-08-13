-- Add explicit policy to deny public access to users table
-- This ensures that unauthenticated users cannot access any user data

-- First, let's make sure RLS is enabled (it should be already)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop the existing policy that might be too permissive
DROP POLICY IF EXISTS "Authenticated users can view their own profile" ON public.users;

-- Create a more explicit policy that only allows authenticated users to view their own data
CREATE POLICY "Users can only view their own profile data" 
ON public.users 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Ensure no public/anon access by creating an explicit deny-all policy for anon role
CREATE POLICY "Deny all anonymous access to users" 
ON public.users 
FOR ALL 
TO anon
USING (false);

-- Also fix the creator_earnings table which has the same issue
ALTER TABLE public.creator_earnings ENABLE ROW LEVEL SECURITY;

-- Add explicit policy to deny public access to creator_earnings
CREATE POLICY "Deny all anonymous access to creator_earnings" 
ON public.creator_earnings 
FOR ALL 
TO anon
USING (false);

-- Ensure the existing policy for creator_earnings is explicit about authenticated users only
DROP POLICY IF EXISTS "Creators can view their own earnings" ON public.creator_earnings;

CREATE POLICY "Authenticated creators can view their own earnings" 
ON public.creator_earnings 
FOR SELECT 
TO authenticated
USING (creator_id IN (
  SELECT creators.id 
  FROM creators 
  WHERE creators.user_id = auth.uid()
));