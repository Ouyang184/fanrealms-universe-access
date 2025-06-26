
-- First, let's see what tables are currently in the realtime publication
SELECT schemaname, tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Remove only the tables that actually exist in the publication
-- We'll use DO blocks to handle cases where tables might not be in the publication

DO $$
BEGIN
    -- Try to remove each table, ignoring errors if they're not in the publication
    BEGIN
        ALTER publication supabase_realtime DROP TABLE public.messages;
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore error if table not in publication
    END;
    
    BEGIN
        ALTER publication supabase_realtime DROP TABLE public.notifications;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER publication supabase_realtime DROP TABLE public.posts;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER publication supabase_realtime DROP TABLE public.membership_tiers;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER publication supabase_realtime DROP TABLE public.follows;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER publication supabase_realtime DROP TABLE public.likes;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER publication supabase_realtime DROP TABLE public.comments;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER publication supabase_realtime DROP TABLE public.conversations;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER publication supabase_realtime DROP TABLE public.conversation_participants;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
END $$;

-- Final check to see what's left in the publication
SELECT schemaname, tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
