
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Safely access window.env with optional chaining and fallback to empty strings
const supabaseUrl = window?.env?.VITE_SUPABASE_URL || '';
const supabaseKey = window?.env?.VITE_SUPABASE_ANON_KEY || '';

// Validate environment variables are set
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Please check window.env settings in index.html.');
}

// Create a single instance of the Supabase client with proper typing
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  }
);

// Export types for ease of use
export type Profile = Database['public']['Tables']['users']['Row'];
export type Session = Database['auth']['Tables']['sessions']['Row'];
