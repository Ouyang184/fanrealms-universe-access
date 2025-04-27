
import { createClient } from '@supabase/supabase-js';

// Retrieve environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables are set
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

// Create a single instance of the Supabase client
export const supabase = createClient(
  supabaseUrl || '',
  supabaseKey || ''
);

export type Profile = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  website: string | null;
  profile_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type Session = {
  user: {
    id: string;
    email: string;
  };
};
