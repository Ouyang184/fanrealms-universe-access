
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function authenticateUser(req: Request, supabaseService: any) {
  console.log('=== AUTHENTICATION START ===');
  
  const authHeader = req.headers.get('Authorization');
  console.log('Auth header present:', !!authHeader);
  
  if (!authHeader || typeof authHeader !== 'string') {
    console.error('No valid authorization header provided');
    throw new Error('Authorization header required');
  }

  if (!authHeader.startsWith('Bearer ')) {
    console.error('Invalid authorization header format');
    throw new Error('Invalid authorization header format');
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix
  console.log('Token extracted, length:', token.length);

  try {
    const { data: { user }, error } = await supabaseService.auth.getUser(token);
    
    if (error) {
      console.error('Auth error:', error);
      throw new Error(`Authentication failed: ${error.message}`);
    }
    
    if (!user) {
      console.error('No user found');
      throw new Error('User not found');
    }

    console.log('User authenticated successfully:', user.id);
    return user;
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}
