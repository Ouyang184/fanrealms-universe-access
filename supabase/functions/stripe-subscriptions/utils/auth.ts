
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function authenticateUser(authHeader: string | null, supabaseUrl: string, supabaseAnonKey: string) {
  console.log('Authenticating user...');
  
  if (!authHeader) {
    console.log('ERROR: Missing authorization header');
    throw new Error('Missing authorization');
  }

  console.log('Authorization header found');

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  console.log('Supabase client created');

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.log('ERROR: User authentication failed:', userError);
    throw new Error('Unauthorized');
  }

  console.log('User authenticated:', user.id);
  return user;
}
