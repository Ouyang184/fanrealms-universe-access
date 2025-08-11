-- Create a SECURITY DEFINER function to expose only public user fields
create or replace function public.get_user_public_profiles(
  ids uuid[] default null,
  usernames text[] default null
)
returns table (
  id uuid,
  username text,
  profile_picture text,
  website text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select u.id, u.username, u.profile_picture, u.website, u.created_at
  from public.users u
  where (ids is null or u.id = any(ids))
    and (usernames is null or u.username = any(usernames));
$$;

-- Create a view that uses the function so clients can SELECT without exposing the base table
create or replace view public.user_public_profiles as
select * from public.get_user_public_profiles(null, null);

-- Grant access to the view and function to both anon and authenticated roles
grant select on public.user_public_profiles to anon, authenticated;
grant execute on function public.get_user_public_profiles(uuid[], text[]) to anon, authenticated;

-- Tighten RLS on the users table: remove broad public SELECT
drop policy if exists "Users can view public profiles" on public.users;

-- Ensure there's a self-view policy (keep existing one if present)
-- If not present in some environments, create it defensively
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
      and tablename = 'users' 
      and policyname = 'Users can view their own profile'
  ) then
    create policy "Users can view their own profile" on public.users
    for select using (auth.uid() = id);
  end if;
end $$;