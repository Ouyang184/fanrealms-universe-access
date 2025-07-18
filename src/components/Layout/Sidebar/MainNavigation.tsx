
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Rss, 
  Compass, 
  MessageSquare, 
  ShoppingBag, 
  Settings,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MainNavigationProps {
  collapsed: boolean;
  onMobileNavClick?: () => void;
}

export function MainNavigation({ collapsed, onMobileNavClick }: MainNavigationProps) {
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
    { path: "/requests", icon: FileText, label: "Requests" },
    { path: "/subscriptions", icon: ShoppingBag, label: "Subscriptions" },
    { path: "/settings", icon: Settings, label: "Account Settings" },
  ];

  const handleNavClick = () => {
    if (onMobileNavClick) {
      onMobileNavClick();
    }
  };

  return (
    <div className="space-y-1 p-2">
      {navigationItems.map((item) => (
        <Link to={item.path} key={item.path} className="block" onClick={handleNavClick}>
           <Button
            variant={isActive(item.path) ? "secondary" : "ghost"}
            className={cn(
              "w-full font-medium gap-3",
              collapsed ? "justify-center px-2" : "justify-start",
              isActive(item.path) && "bg-primary/30",
            )}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Button>
        </Link>
      ))}
    </div>
  );
}
