
import { useAuth } from "@/contexts/AuthContext"
import LoadingSpinner from "@/components/LoadingSpinner"
import { useNotifications } from "@/hooks/useNotifications"
import { useEffect } from "react"
import { EmptyNotifications } from "@/components/notifications/EmptyNotifications"
import { NotificationHeader } from "@/components/notifications/NotificationHeader"
import { NotificationTabs } from "@/components/notifications/NotificationTabs"

export default function CreatorNotifications() {
  const { user } = useAuth();
  const { 
    notifications, 
    isLoading: loadingNotifications, 
    unreadCounts, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    markAsReadOnView
  } = useNotifications();
  
  // Auto-mark unread notifications as read when user views the page
  useEffect(() => {
    if (notifications.length > 0) {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      if (unreadNotifications.length > 0) {
        // Mark as read after a short delay to ensure user has "seen" them
        const timer = setTimeout(() => {
          markAsReadOnView(unreadNotifications.map(n => n.id));
        }, 2000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [notifications, markAsReadOnView]);
  
  // If still loading notifications, show loading state
  if (loadingNotifications) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner className="h-12 w-12" />
      </div>
    );
  }
  
  // Check if user has notifications
  const hasNotifications = notifications && notifications.length > 0;

  // If user has no notifications, show the empty notifications state
  if (!hasNotifications) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <NotificationHeader 
          unreadCount={unreadCounts.all}
          onMarkAllAsRead={markAllAsRead}
        />
        <EmptyNotifications />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <NotificationHeader 
        unreadCount={unreadCounts.all}
        onMarkAllAsRead={markAllAsRead}
      />

      <NotificationTabs
        notifications={notifications}
        unreadCounts={unreadCounts}
        onMarkAsRead={markAsRead}
        onDelete={deleteNotification}
      />
    </div>
  );
}
