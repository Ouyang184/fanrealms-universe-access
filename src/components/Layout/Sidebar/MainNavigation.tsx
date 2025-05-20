
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Rss, 
  Compass, 
  MessageSquare, 
  Bell, 
  ShoppingBag, 
  Settings 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MainNavigationProps {
  collapsed: boolean;
}

export function MainNavigation({ collapsed }: MainNavigationProps) {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navigationItems = [
    { path: "/home", icon: Home, label: "Home" },
    { path: "/feed", icon: Rss, label: "Feed" },
    { path: "/following", icon: Users, label: "Following" },
    { path: "/explore", icon: Compass, label: "Explore" },
    { path: "/messages", icon: MessageSquare, label: "Messages" },
    { path: "/notifications", icon: Bell, label: "Notifications" },
    { path: "/subscriptions", icon: ShoppingBag, label: "Subscriptions" },
    { path: "/settings", icon: Settings, label: "Account Settings" },
  ];

  return (
    <div className="space-y-1 p-2">
      {navigationItems.map((item) => (
        <Link to={item.path} key={item.path} className="block">
          <Button
            variant={isActive(item.path) ? "secondary" : "ghost"}
            className={cn(
              "w-full font-medium",
              collapsed ? "justify-center px-2" : "justify-start gap-3",
              isActive(item.path) && "bg-primary/30",
            )}
          >
            <item.icon className="h-5 w-5" />
            {!collapsed && <span>{item.label}</span>}
          </Button>
        </Link>
      ))}
    </div>
  );
}
