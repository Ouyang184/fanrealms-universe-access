
import { Bell, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";
import { useOptimizedRealtime } from "@/hooks/useOptimizedRealtime";

export function HeaderNotifications() {
  const { user } = useAuth();
  const { unreadCounts } = useNotifications();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const location = useLocation();
  const { isCreator } = useCreatorProfile();
  
  // Optimized message count fetching
  const fetchMessagesCount = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id as any)
        .neq('sender_id', user.id as any)
        .eq('is_read', false as any);
          
      if (!error && count !== null) {
        setUnreadMessages(count);
      } else {
        setUnreadMessages(0);
      }
    } catch (error) {
      console.error('Error fetching message count:', error);
      setUnreadMessages(0);
    }
  }, [user?.id]);
  
  // Initial fetch
  useEffect(() => {
    fetchMessagesCount();
  }, [fetchMessagesCount]);

  // Use optimized realtime hook instead of direct subscriptions
  useOptimizedRealtime({
    table: 'messages',
    event: '*',
    filter: `receiver_id=eq.${user?.id}`,
    callback: () => fetchMessagesCount(),
    enabled: !!user?.id,
    debounceMs: 2000 // Increased debounce to reduce database load
  });

  // Refresh message count when returning from messages page (with debounce)
  useEffect(() => {
    if (user?.id && location.pathname !== '/messages') {
      const timer = setTimeout(fetchMessagesCount, 1000);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, user?.id, fetchMessagesCount]);

  return (
    <div className="flex items-center gap-2">
      {/* Notifications button - only show for creators */}
      {isCreator && (
        <Link to="/creator-studio/notifications">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-foreground relative"
          >
            <Bell className="h-5 w-5" />
            {unreadCounts.all > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {unreadCounts.all > 9 ? '9+' : unreadCounts.all}
              </span>
            )}
            <span className="sr-only">Notifications</span>
          </Button>
        </Link>
      )}
      
      {/* Messages button */}
      <Link to="/messages">
        <Button 
          variant="ghost" 
          size="icon"  
          className="text-muted-foreground hover:text-foreground relative"
        >
          <MessageSquare className="h-5 w-5" />
          {unreadMessages > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </span>
          )}
          <span className="sr-only">Messages</span>
        </Button>
      </Link>
    </div>
  );
}
