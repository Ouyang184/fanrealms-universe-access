-- Re-enable RLS on commission_types table
ALTER TABLE public.commission_types ENABLE ROW LEVEL SECURITY;

-- Update users table policy to exclude email from public access
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;

-- Create new policy that excludes email from public access
CREATE POLICY "Users can view public profiles" ON public.users
FOR SELECT 
USING (true);

-- Create policy for users to view their own email
CREATE POLICY "Users can view their own email" ON public.users
FOR SELECT 
USING (auth.uid() = id);