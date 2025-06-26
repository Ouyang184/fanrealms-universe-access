
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

// Create the Supabase client with MINIMAL realtime configuration
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
    // DRASTICALLY REDUCED realtime configuration to eliminate performance issues
    realtime: {
      params: {
        eventsPerSecond: 1, // Minimal events
      },
      heartbeatIntervalMs: 600000, // 10 minutes - very long intervals
      reconnectAfterMs: () => 60000, // 1 minute reconnect delay
    },
    global: {
      headers: {
        'X-Client-Info': 'fanrealms-web-optimized', 
      },
    },
    db: {
      schema: 'public'
    }
  }
);

// AGGRESSIVE channel management to prevent duplicate subscriptions
const activeChannels = new Map<string, any>();

// Only create channels when absolutely necessary with VERY strict scoping
export const createScopedChannel = (channelName: string, filters?: { table?: string; filter?: string; userId?: string }) => {
  const scopedChannelName = filters?.userId ? `${channelName}-${filters.userId}` : channelName;
  
  if (activeChannels.has(scopedChannelName)) {
    console.log(`Reusing existing scoped channel: ${scopedChannelName}`);
    return activeChannels.get(scopedChannelName);
  }
  
  console.log(`Creating new scoped channel: ${scopedChannelName}`, filters);
  const channel = supabase.channel(scopedChannelName, {
    config: {
      presence: { key: '' },
      broadcast: { self: false, ack: false }
    }
  });
  
  activeChannels.set(scopedChannelName, channel);
  return channel;
};

// IMMEDIATE cleanup function
export const cleanupChannel = (channelName: string, userId?: string) => {
  const scopedChannelName = userId ? `${channelName}-${userId}` : channelName;
  
  if (activeChannels.has(scopedChannelName)) {
    const channel = activeChannels.get(scopedChannelName);
    supabase.removeChannel(channel);
    activeChannels.delete(scopedChannelName);
    console.log(`Immediately cleaned up channel: ${scopedChannelName}`);
  }
};

// Cleanup all channels - use on app shutdown/navigation
export const cleanupAllChannels = () => {
  console.log('Cleaning up all channels...');
  activeChannels.forEach((channel, channelName) => {
    supabase.removeChannel(channel);
    console.log(`Removed channel: ${channelName}`);
  });
  activeChannels.clear();
};

console.log('Supabase client initialized with MINIMAL realtime configuration');

// Export supabase for use in other files
export { supabase as default };
