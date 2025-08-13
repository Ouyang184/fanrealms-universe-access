
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Supabase credentials (Lovable: avoid VITE_* envs)
const SUPABASE_URL = 'https://eaeqyctjljbtcatlohky.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZXF5Y3RqbGpidGNhdGxvaGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3ODE1OTgsImV4cCI6MjA2MTM1NzU5OH0.FrxmM9nqPNUjo3ZTMUdUWPirm0q1WFssoierxq9zb7A';

// Create the Supabase client with persistent session configuration
export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'fanrealms-auth',
      storage: window.localStorage,
      flowType: 'pkce'
    }
  }
);

console.log('Supabase client initialized with persistent sessions');

// Export supabase for use in other files
export { supabase as default };
