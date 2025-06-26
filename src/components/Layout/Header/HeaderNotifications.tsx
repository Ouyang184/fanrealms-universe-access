
import { Bell, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";

export function HeaderNotifications() {
  const { user } = useAuth();
  const { unreadCounts } = useNotifications();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const location = useLocation();
  const { isCreator } = useCreatorProfile();
  
  useEffect(() => {
    if (!user?.id) return;
    
    // Optimized: Fetch unread messages count without excessive realtime subscriptions
    const fetchMessagesCount = async () => {
      try {
        const { count, error } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', user.id)
          .neq('sender_id', user.id) // Exclude messages sent by the user themselves
          .eq('is_read', false);
          
        if (!error && count !== null) {
          setUnreadMessages(count);
        } else {
          setUnreadMessages(0);
        }
      } catch (error) {
        console.error('Error fetching message count:', error);
        setUnreadMessages(0);
      }
    };
    
    // Initial fetch
    fetchMessagesCount();
    
    // Optimized: Use a single, focused realtime subscription instead of multiple wildcards
    const messagesChannel = supabase
      .channel(`header-messages-${user.id}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages', 
          filter: `receiver_id=eq.${user.id}` 
        }, 
        () => {
          // Use setTimeout to avoid blocking realtime callback
          setTimeout(fetchMessagesCount, 0);
        }
      )
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'messages', 
          filter: `receiver_id=eq.${user.id}` 
        }, 
        () => {
          setTimeout(fetchMessagesCount, 0);
        }
      )
      .subscribe();
    
    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [user?.id]);

  // Optimized: Refresh message count when returning from messages page
  useEffect(() => {
    if (user?.id && location.pathname !== '/messages') {
      // Small delay to allow any pending updates to complete
      const timer = setTimeout(() => {
        const fetchMessagesCount = async () => {
          try {
            const { count, error } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('receiver_id', user.id)
              .neq('sender_id', user.id)
              .eq('is_read', false);
              
            if (!error && count !== null) {
              setUnreadMessages(count);
            }
          } catch (error) {
            console.error('Error refreshing message count:', error);
          }
        };
        fetchMessagesCount();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [location.pathname, user?.id]);

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
