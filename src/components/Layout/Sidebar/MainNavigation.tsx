
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, Users, Rss, Compass, MessageSquare, ShoppingBag, Settings,
  FileText, Store, Briefcase, MessagesSquare
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MainNavigationProps {
  collapsed: boolean;
  onMobileNavClick?: () => void;
  isMobile?: boolean;
}

export function MainNavigation({ collapsed, onMobileNavClick, isMobile = false }: MainNavigationProps) {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const navigationItems = [
    { path: "/home", icon: Home, label: "Home" },
    { path: "/feed", icon: Rss, label: "Feed" },
    { path: "/following", icon: Users, label: "Following" },
    { path: "/explore", icon: Compass, label: "Explore" },
    { path: "/marketplace", icon: Store, label: "Marketplace" },
    { path: "/jobs", icon: Briefcase, label: "Jobs" },
    { path: "/forum", icon: MessagesSquare, label: "Forum" },
    { path: "/messages", icon: MessageSquare, label: "Messages" },
    { path: "/requests", icon: FileText, label: "Requests" },
    { path: "/subscriptions", icon: ShoppingBag, label: "Subscriptions" },
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="space-y-0.5 px-2 py-2">
      {navigationItems.map((item) => (
        <Link
          to={item.path}
          key={item.path}
          onClick={onMobileNavClick}
          className={cn(
            "flex items-center gap-3 px-2 py-1.5 rounded text-sm transition-colors",
            collapsed && !isMobile ? "justify-center" : "",
            isActive(item.path)
              ? "text-foreground bg-accent font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
          )}
        >
          <item.icon className="h-4 w-4 flex-shrink-0" />
          {(!collapsed || isMobile) && <span>{item.label}</span>}
        </Link>
      ))}
    </div>
  );
}
