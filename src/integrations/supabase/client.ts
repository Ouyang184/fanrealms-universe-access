
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Safely access window.env with validation
const getEnvVar = (key: keyof Window['env']) => {
  const value = window?.env?.[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

let supabase: ReturnType<typeof createClient<Database>>;

try {
  // Get and validate environment variables
  const SUPABASE_URL = getEnvVar('VITE_SUPABASE_URL');
  const SUPABASE_ANON_KEY = getEnvVar('VITE_SUPABASE_ANON_KEY');

  // Create the Supabase client
  supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (error) {
  console.error('Supabase client initialization failed:', error);
  // Re-throw to prevent app from running with invalid configuration
  throw error;
}

export { supabase };
