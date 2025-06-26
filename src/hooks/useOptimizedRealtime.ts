
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
  debounceMs = 5000, // Much longer debounce
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
    // Only create realtime subscriptions for critical tables
    const allowedTables = ['messages', 'user_subscriptions', 'notifications'];
    
    if (!enabled || !allowedTables.includes(table)) {
      console.log(`Realtime disabled for table: ${table} (not in allowed list)`);
      return;
    }

    // Require specific filters for performance
    if (!filter && !userId) {
      console.warn(`Realtime subscription blocked: ${table} requires specific filter or userId for performance`);
      return;
    }

    const channelName = `scoped-${table}-${event}`;
    channelNameRef.current = channelName;
    
    console.log(`Setting up scoped realtime for: ${table} with filter: ${filter}`);
    
    const channel = createScopedChannel(channelName, { table, filter, userId });
    channelRef.current = channel;
    
    channel
      .on('postgres_changes', {
        event,
        schema: 'public',
        table,
        filter // Apply specific filter
      }, debouncedCallback)
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Scoped realtime subscription active for ${table} with filter: ${filter}`);
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
