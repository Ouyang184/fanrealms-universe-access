
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Safely access window.env with validation
const getEnvVar = (key: keyof Window['env']) => {
  const value = window?.env?.[key];
  if (!value) {
    console.error(`Missing required environment variable: ${key}`);
    return ''; // Return empty string instead of throwing
  }
  return value;
};

// Get environment variables - Use the actual project values for now
const SUPABASE_URL = 'https://eaeqyctjljbtcatlohky.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZXF5Y3RqbGpidGNhdGxvaGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3ODE1OTgsImV4cCI6MjA2MTM1NzU5OH0.FrxmM9nqPNUjo3ZTMUdUWPirm0q1WFssoierxq9zb7A';

console.log('Supabase client configuration:', {
  url: SUPABASE_URL,
  hasAnonKey: !!SUPABASE_ANON_KEY
});

// Create the Supabase client with optimized configuration for performance
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
    },
    realtime: {
      // Optimize realtime configuration to reduce overhead
      params: {
        eventsPerSecond: 10, // Limit events per second to reduce load
      },
      heartbeatIntervalMs: 30000, // Fixed: Use proper number type
      reconnectAfterMs: () => 1000, // Fixed: Use function returning number
    },
    global: {
      headers: {
        'X-Client-Info': 'fanrealms-web', // Add client identifier
      },
    },
  }
);

console.log('Supabase client initialized with optimized configuration');

// Export supabase for use in other files
export { supabase as default };
