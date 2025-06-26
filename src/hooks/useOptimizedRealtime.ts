
import { useEffect, useCallback, useRef } from 'react';
import { createScopedChannel, cleanupChannel } from '@/integrations/supabase/client';

interface UseOptimizedRealtimeOptions {
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string; // Use specific filters like "user_id=eq.123"
  callback: (payload: any) => void;
  enabled?: boolean;
  debounceMs?: number;
  userId?: string; // For user-scoped channels
}

export const useOptimizedRealtime = ({
  table,
  event,
  filter,
  callback,
  enabled = true,
  debounceMs = 10000, // Increased to 10 seconds to dramatically reduce queries
  userId
}: UseOptimizedRealtimeOptions) => {
  const debounceRef = useRef<NodeJS.Timeout>();
  const channelRef = useRef<any>();
  const channelNameRef = useRef<string>();

  const debouncedCallback = useCallback((payload: any) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      callback(payload);
    }, debounceMs);
  }, [callback, debounceMs]);

  useEffect(() => {
    // DRASTICALLY restrict realtime to only critical user-specific operations
    const allowedTables = ['messages']; // Only messages need realtime
    
    if (!enabled || !allowedTables.includes(table)) {
      console.log(`Realtime BLOCKED for table: ${table} (performance optimization)`);
      return;
    }

    // REQUIRE specific user filtering for ALL subscriptions
    if (!filter || !userId) {
      console.warn(`Realtime subscription BLOCKED: ${table} requires userId and specific filter for performance`);
      return;
    }

    // Only allow user-specific filters to prevent broad subscriptions
    if (!filter.includes(`user_id=eq.${userId}`) && 
        !filter.includes(`sender_id=eq.${userId}`) && 
        !filter.includes(`receiver_id=eq.${userId}`)) {
      console.warn(`Realtime subscription BLOCKED: ${table} filter must be user-specific for performance`);
      return;
    }

    const channelName = `scoped-${table}-${event}-${userId}`;
    channelNameRef.current = channelName;
    
    console.log(`Setting up RESTRICTED realtime for: ${table} with user filter: ${filter}`);
    
    const channel = createScopedChannel(channelName, { table, filter, userId });
    channelRef.current = channel;
    
    channel
      .on('postgres_changes', {
        event,
        schema: 'public',
        table,
        filter // Apply specific user filter
      }, debouncedCallback)
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Scoped realtime active for ${table} with filter: ${filter}`);
        }
        if (status === 'CHANNEL_ERROR') {
          console.error(`Realtime subscription error for ${table}`);
        }
      });

    return () => {
      console.log(`Cleaning up scoped realtime for: ${table}`);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (channelNameRef.current) {
        cleanupChannel(channelNameRef.current, userId);
      }
    };
  }, [table, event, filter, debouncedCallback, enabled, userId]);
};
