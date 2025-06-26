
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
  console.log('Starting signup process for:', email);
  
  // Simple signup without artificial timeouts
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    console.error('Supabase signup error details:', {
      message: error.message,
      status: error.status,
      name: error.name
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
    
    throw new Error(error.message || 'Unable to create account. Please try again.');
  }
  
  console.log('Signup successful:', data.user?.id);
  
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
