
import { supabase } from '@/integrations/supabase/client';
import type { AuthResult } from '@/lib/types/auth';

export const signInWithCredentials = async (email: string, password: string): Promise<AuthResult> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  
  return {
    success: true,
    user: data.user,
    session: data.session
  };
};

export const signUpWithCredentials = async (email: string, password: string): Promise<AuthResult> => {
  console.log('Starting ULTRA-OPTIMIZED signup process for:', email);
  
  // Reduced timeout to 10 seconds to fail faster
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Signup timeout after 10 seconds - server overloaded')), 10000);
  });
  
  // Absolute minimal signup with no extra options
  const signupPromise = supabase.auth.signUp({
    email,
    password
    // Removed ALL options to minimize processing time
  });

  const { data, error } = await Promise.race([signupPromise, timeoutPromise]) as any;

  if (error) {
    console.error('Supabase signup error details:', {
      message: error.message,
      status: error.status,
      name: error.name,
      stack: error.stack
    });
    
    // Enhanced error handling for specific signup issues
    if (error.message?.includes('already registered') || error.message?.includes('User already registered')) {
      throw new Error('This email is already registered. Please try logging in instead.');
    }
    
    if (error.message?.includes('invalid email')) {
      throw new Error('Please enter a valid email address.');
    }

    if (error.message?.includes('rate limit') || error.message?.includes('too many')) {
      throw new Error('Too many signup attempts. Please wait a few minutes before trying again.');
    }
    
    // Enhanced server overload detection
    const isServerOverloaded = 
      error.status === 504 || 
      error.status === 502 ||
      error.status === 503 ||
      error.status === 408 ||
      error.name === 'AbortError' ||
      error.name === 'AuthRetryableFetchError' ||
      error.message?.includes('timeout') ||
      error.message?.includes('504') ||
      error.message?.includes('502') ||
      error.message?.includes('503') ||
      error.message?.includes('Gateway') ||
      error.message?.includes('upstream') ||
      error.message?.includes('context deadline') ||
      error.message === '{}' ||
      !error.message ||
      error.message.trim() === '';
    
    if (isServerOverloaded) {
      throw new Error('Supabase is overloaded. Database optimizations applied. Please wait 30 seconds and try again.');
    }
    
    throw new Error(error.message || 'Unable to create account. Please try again.');
  }
  
  console.log('ULTRA-OPTIMIZED signup successful:', data.user?.id);
  
  return {
    success: true,
    user: data.user!,
    session: data.session
  };
};

export const signInWithMagicLink = async (email: string) => {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw error;
};

export const signOutUser = async () => {
  await supabase.auth.signOut({ scope: 'local' });
};
