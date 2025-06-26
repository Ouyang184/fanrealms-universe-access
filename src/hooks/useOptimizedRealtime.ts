
import { useEffect, useCallback, useRef } from 'react';
import { createOptimizedChannel, cleanupChannel } from '@/integrations/supabase/client';

interface UseOptimizedRealtimeOptions {
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  callback: (payload: any) => void;
  enabled?: boolean;
  debounceMs?: number;
}

export const useOptimizedRealtime = ({
  table,
  event,
  filter,
  callback,
  enabled = true,
  debounceMs = 1000
}: UseOptimizedRealtimeOptions) => {
  const debounceRef = useRef<NodeJS.Timeout>();
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
    if (!enabled) return;

    // Create unique channel name to prevent conflicts
    const channelName = `optimized-${table}-${event}-${Date.now()}`;
    channelNameRef.current = channelName;
    
    console.log(`Setting up optimized realtime for: ${table}`);
    
    const channel = createOptimizedChannel(channelName)
      .on('postgres_changes', {
        event,
        schema: 'public',
        table,
        ...(filter && { filter })
      }, debouncedCallback)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Optimized realtime subscription active for ${table}`);
        }
      });

    return () => {
      console.log(`Cleaning up optimized realtime for: ${table}`);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (channelNameRef.current) {
        cleanupChannel(channelNameRef.current);
      }
    };
  }, [table, event, filter, debouncedCallback, enabled]);
};
