
export async function authenticateUser(req: Request, supabase: any) {
  console.log('[Auth] Starting authentication...');
  
  const authHeader = req.headers.get('Authorization');
  console.log('[Auth] Authorization header present:', !!authHeader);
  console.log('[Auth] Authorization header value:', authHeader ? authHeader.substring(0, 20) + '...' : 'none');
  
  if (!authHeader) {
    console.error('[Auth] No authorization header provided');
    throw new Error('Authorization header required');
  }

  const token = authHeader.replace('Bearer ', '');
  console.log('[Auth] Extracted token length:', token.length);
  console.log('[Auth] Token starts with:', token.substring(0, 20) + '...');
  
  console.log('[Auth] Calling supabase.auth.getUser...');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  console.log('[Auth] Auth response:', { 
    hasUser: !!user, 
    userId: user?.id,
    userEmail: user?.email,
    hasError: !!error,
    errorMessage: error?.message 
  });
  
  if (error || !user) {
    console.error('[Auth] Authentication error:', error);
    throw new Error(`Authentication failed: ${error?.message || 'User not found'}`);
  }

  console.log('[Auth] Authentication successful for user:', user.id);
  return user;
}
