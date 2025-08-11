
export async function authenticateUser(req: Request, supabase: any) {
  console.log('[Auth] Starting authentication...');
  
  try {
    const authHeader = req.headers.get('Authorization');
    console.log('[Auth] Authorization header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('[Auth] No authorization header provided');
      throw new Error('Authorization header required');
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('[Auth] Calling supabase.auth.getUser...');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    console.log('[Auth] Auth response:', { 
      hasUser: !!user, 
      userId: user?.id,
      hasError: !!error
    });
    
    if (error || !user) {
      console.error('[Auth] Authentication error:', error);
      throw new Error(`Authentication failed: ${error?.message || 'User not found'}`);
    }

    console.log('[Auth] Authentication successful for user:', user.id);
    return user;
  } catch (authError) {
    console.error('[Auth] CRITICAL AUTH ERROR:', authError);
    console.error('[Auth] Error type:', authError.constructor?.name);
    console.error('[Auth] Error message:', authError.message);
    throw authError;
  }
}
