
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuthCheck } from "@/lib/hooks/useAuthCheck";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader 
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LoadingSpinner from "@/components/LoadingSpinner";

type Notification = {
  id: number;
  message: string;
  sender: {
    name: string;
    avatar?: string;
  };
  timestamp: string;
  read: boolean;
};

// Sample notifications data
const sampleNotifications: Notification[] = [
  {
    id: 1,
    message: "New post from Creative Studio: 'Getting Started with Digital Art'",
    sender: {
      name: "Creative Studio",
      avatar: "https://picsum.photos/seed/avatar1/100/100"
    },
    timestamp: "Just now",
    read: false
  },
  {
    id: 2,
    message: "Animation Pro replied to your comment",
    sender: {
      name: "Animation Pro",
      avatar: "https://picsum.photos/seed/avatar3/100/100"
    },
    timestamp: "2 hours ago",
    read: false
  },
  {
    id: 3,
    message: "Game Dev mentioned you in a post",
    sender: {
      name: "Game Dev",
      avatar: "https://picsum.photos/seed/avatar4/100/100"
    },
    timestamp: "Yesterday",
    read: true
  },
  {
    id: 4,
    message: "Your subscription to Content Masters has been renewed",
    sender: {
      name: "Content Masters",
      avatar: "https://picsum.photos/seed/avatar2/100/100"
    },
    timestamp: "3 days ago",
    read: true
  },
];

function NotificationItem({ notification }: { notification: Notification }) {
  return (
    <Card className={`mb-3 ${!notification.read ? 'bg-secondary/30' : ''}`}>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={notification.sender.avatar} alt={notification.sender.name} />
            <AvatarFallback>{notification.sender.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <CardDescription className="text-foreground text-sm">{notification.message}</CardDescription>
            <CardDescription className="text-xs">{notification.timestamp}</CardDescription>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

function NotificationSkeleton() {
  return (
    <Card className="mb-3">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex flex-col space-y-2 flex-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

export default function Notifications() {
  const { isChecking } = useAuthCheck();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (isChecking) return;
    
    const timer = setTimeout(() => {
      setNotifications(sampleNotifications);
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [isChecking]);
  
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `You have ${unreadCount} unread notifications` : 'No new notifications'}
          </p>
        </div>
        
        <div>
          {loading ? (
            <>
              <NotificationSkeleton />
              <NotificationSkeleton />
              <NotificationSkeleton />
              <NotificationSkeleton />
            </>
          ) : notifications.length > 0 ? (
            notifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No notifications yet.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
