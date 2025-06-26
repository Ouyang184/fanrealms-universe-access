
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

// Create the Supabase client with highly optimized configuration to minimize realtime overhead
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
      // Drastically reduce realtime overhead to fix performance issue
      params: {
        eventsPerSecond: 2, // Reduced from 10 to 2 to minimize database load
      },
      heartbeatIntervalMs: 60000, // Increased from 30s to 60s to reduce heartbeat frequency
      reconnectAfterMs: () => 5000, // Increased reconnect delay
      // Remove invalid transport property
    },
    global: {
      headers: {
        'X-Client-Info': 'fanrealms-web-optimized', // Updated identifier
      },
    },
    // Add database connection pooling optimization
    db: {
      schema: 'public'
    }
  }
);

// Global channel management to prevent duplicate subscriptions
const activeChannels = new Map<string, any>();

// Optimized channel creation with deduplication
export const createOptimizedChannel = (channelName: string) => {
  if (activeChannels.has(channelName)) {
    console.log(`Reusing existing channel: ${channelName}`);
    return activeChannels.get(channelName);
  }
  
  console.log(`Creating new optimized channel: ${channelName}`);
  const channel = supabase.channel(channelName, {
    config: {
      // Minimize broadcast overhead
      presence: { key: '' },
      broadcast: { self: false, ack: false }
    }
  });
  
  activeChannels.set(channelName, channel);
  return channel;
};

// Cleanup function to remove unused channels
export const cleanupChannel = (channelName: string) => {
  if (activeChannels.has(channelName)) {
    const channel = activeChannels.get(channelName);
    supabase.removeChannel(channel);
    activeChannels.delete(channelName);
    console.log(`Cleaned up channel: ${channelName}`);
  }
};

console.log('Supabase client initialized with performance-optimized configuration');

// Export supabase for use in other files
export { supabase as default };
