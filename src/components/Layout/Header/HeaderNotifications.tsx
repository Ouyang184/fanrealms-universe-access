
import { Bell, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

export function HeaderNotifications() {
  const { user } = useAuth();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  
  useEffect(() => {
    if (!user?.id) return;
    
    // Fetch unread notifications count
    const fetchNotificationsCount = async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
        
      if (!error && count !== null) {
        setUnreadNotifications(count);
      } else {
        // Reset to 0 if there's an error or no data
        setUnreadNotifications(0);
      }
    };
    
    // Fetch unread messages count
    const fetchMessagesCount = async () => {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);
        
      if (!error && count !== null) {
        setUnreadMessages(count);
      } else {
        // Reset to 0 if there's an error or no data
        setUnreadMessages(0);
      }
    };
    
    // Initial fetch
    fetchNotificationsCount();
    fetchMessagesCount();
    
    // Set up subscription for real-time updates
    const notificationsChannel = supabase
      .channel(`notifications-${user.id}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, 
        () => {
          fetchNotificationsCount();
        }
      )
      .subscribe();
      
    const messagesChannel = supabase
      .channel(`messages-${user.id}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, 
        () => {
          fetchMessagesCount();
        }
      )
      .subscribe();
    
    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [user?.id]);

  return (
    <>
      <Link to="/notifications">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
          <Bell className="h-5 w-5" />
          {unreadNotifications > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </Link>
      <Link to="/messages">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
          <MessageSquare className="h-5 w-5" />
          {unreadMessages > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </span>
          )}
          <span className="sr-only">Messages</span>
        </Button>
      </Link>
    </>
  );
}
