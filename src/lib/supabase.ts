
import { createClient } from '@supabase/supabase-js';

// Retrieve environment variables from the window.env object
const supabaseUrl = window.env?.VITE_SUPABASE_URL;
const supabaseKey = window.env?.VITE_SUPABASE_ANON_KEY;

// Validate environment variables are set
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Please check window.env settings in index.html.');
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
