
-- Check for triggers on auth.users table that might be causing delays
SELECT 
    t.tgname AS trigger_name,
    t.tgenabled AS trigger_enabled,
    p.proname AS function_name,
    pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'auth.users'::regclass;

-- Check RLS policies on user-related tables that might be inefficient
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('users', 'creators', 'follows', 'subscriptions', 'user_subscriptions', 'notifications')
ORDER BY tablename, policyname;

-- Check if there are any slow queries or blocking operations
SELECT 
    query,
    state,
    wait_event_type,
    wait_event,
    query_start,
    state_change
FROM pg_stat_activity 
WHERE state != 'idle' 
AND query NOT LIKE '%pg_stat_activity%'
ORDER BY query_start;

-- Check for any functions that might be called during user creation
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
WHERE p.proname LIKE '%user%' OR p.proname LIKE '%handle%'
ORDER BY p.proname;
