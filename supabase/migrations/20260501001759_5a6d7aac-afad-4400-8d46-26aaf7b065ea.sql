-- Remove the duplicate signup trigger that was causing every signup to fail
-- due to a race/duplicate-key conflict with handle_new_auth_user.
DROP TRIGGER IF EXISTS on_auth_user_created_simple ON auth.users;