
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const getEnvVar = (key: keyof Window['env']) => {
  const value = window?.env?.[key];
  if (!value) {
    console.error(`Missing required environment variable: ${key}`);
    return '';
  }
  return value;
};

const SUPABASE_URL = 'https://eaeqyctjljbtcatlohky.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZXF5Y3RqbGpidGNhdGxvaGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3ODE1OTgsImV4cCI6MjA2MTM1NzU5OH0.FrxmM9nqPNUjo3ZTMUdUWPirm0q1WFssoierxq9zb7A';

console.log('Supabase client configuration:', {
  url: SUPABASE_URL,
  hasAnonKey: !!SUPABASE_ANON_KEY
});

// Create the Supabase client with COMPLETELY DISABLED realtime
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
    // COMPLETELY DISABLE realtime to fix 7.4M query overload
    realtime: {
      params: {
        eventsPerSecond: 0, // ZERO events allowed
      },
      heartbeatIntervalMs: 999999999, // Never send heartbeats
      reconnectAfterMs: () => 999999999, // Never reconnect
    },
    global: {
      headers: {
        'X-Client-Info': 'fanrealms-web-no-realtime', 
      },
    },
    db: {
      schema: 'public'
    }
  }
);

// COMPLETELY REMOVE all channel management - no channels allowed
console.log('Supabase client initialized with REALTIME COMPLETELY DISABLED');

// Export supabase for use in other files
export { supabase as default };
