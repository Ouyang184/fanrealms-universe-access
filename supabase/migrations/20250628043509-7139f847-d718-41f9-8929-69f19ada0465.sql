
-- Fix the user ID mismatch by updating the existing record
DO $$
DECLARE
    existing_user_id UUID;
BEGIN
    -- Find the existing user record with the same email
    SELECT id INTO existing_user_id 
    FROM public.users 
    WHERE email = 'fanrealmsdev@gmail.com';
    
    IF existing_user_id IS NOT NULL THEN
        -- Update the existing user record to use the correct auth user ID
        UPDATE public.users 
        SET id = '3be4ae81-cf68-453c-a04b-c62b4dd5f904',
            updated_at = NOW()
        WHERE email = 'fanrealmsdev@gmail.com';
        
        RAISE NOTICE 'Updated user record ID from % to 3be4ae81-cf68-453c-a04b-c62b4dd5f904', existing_user_id;
    ELSE
        -- If no existing record, create a new one
        INSERT INTO public.users (id, email, username, created_at, updated_at)
        VALUES (
            '3be4ae81-cf68-453c-a04b-c62b4dd5f904',
            'fanrealmsdev@gmail.com',
            'fanrealmsdev_' || EXTRACT(EPOCH FROM NOW())::text,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Created new user record';
    END IF;
END $$;
