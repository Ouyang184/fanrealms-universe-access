
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function authenticateUser(authHeader: string | null, supabaseUrl: string, supabaseAnonKey: string) {
  console.log('=== AUTHENTICATION START ===');
  
  if (!authHeader) {
    console.log('ERROR: Missing authorization header');
    throw new Error('Missing authorization header');
  }

  console.log('Authorization header format:', authHeader.substring(0, 20) + '...');

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  console.log('Supabase client created for authentication');

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    console.log('Auth getUser response:', {
      user: user ? { id: user.id, email: user.email } : null,
      error: userError
    });
    
    if (userError) {
      console.log('ERROR: User authentication failed:', userError);
      throw new Error('Authentication failed: ' + userError.message);
    }
    
    if (!user) {
      console.log('ERROR: No user returned from authentication');
      throw new Error('No user found');
    }

    console.log('User authenticated successfully:', { id: user.id, email: user.email });
    return user;
  } catch (authError) {
    console.log('ERROR: Exception during authentication:', authError);
    throw authError;
  }
}
