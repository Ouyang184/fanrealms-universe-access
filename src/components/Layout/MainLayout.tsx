
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "./Sidebar/Sidebar";
import { Header } from "./Header/Header";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const { user, profile, signOut } = useAuth();
  
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Fetch unread messages count
  useEffect(() => {
    if (!user?.id) return;
    
    const fetchUnreadMessagesCount = async () => {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);
        
      if (!error && count !== null) {
        setUnreadMessages(count);
      }
    };
    
    fetchUnreadMessagesCount();
    
    // Set up real-time subscription for new messages
    const messagesChannel = supabase
      .channel(`messages-${user.id}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `receiver_id=eq.${user.id}` 
        }, 
        () => {
          fetchUnreadMessagesCount();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [user?.id]);

  // Fetch unread notifications count
  useEffect(() => {
    if (!user?.id) return;
    
    const fetchUnreadNotificationsCount = async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
        
      if (!error && count !== null) {
        setUnreadNotifications(count);
      }
    };
    
    fetchUnreadNotificationsCount();
    
    // Set up real-time subscription for new notifications
    const notificationsChannel = supabase
      .channel(`notifications-${user.id}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}` 
        }, 
        () => {
          fetchUnreadNotificationsCount();
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchUnreadNotificationsCount();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(notificationsChannel);
    };
  }, [user?.id]);

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        toggleSidebar={toggleSidebar} 
        onSignOut={signOut} 
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          unreadNotifications={unreadNotifications} 
          unreadMessages={unreadMessages} 
          profile={profile} 
          onSignOut={signOut} 
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
