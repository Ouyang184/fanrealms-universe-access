
import { Link, useLocation } from 'react-router-dom';
import { 
  PenTool, 
  BarChart3, 
  DollarSign, 
  FileText, 
  Settings, 
  Users,
  Crown,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CreatorStudioMenuProps {
  collapsed: boolean;
  onMobileNavClick?: () => void;
}

export function CreatorStudioMenu({ collapsed, onMobileNavClick }: CreatorStudioMenuProps) {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const creatorItems = [
    { path: "/creator-studio/dashboard", icon: BarChart3, label: "Creator Dashboard" },
    { path: "/creator-studio/profile", icon: User, label: "Creator Profile" },
    { path: "/creator-studio/posts", icon: FileText, label: "Posts" },
    { path: "/creator-studio/membership-tiers", icon: Crown, label: "Membership Tiers" },
    { path: "/creator-studio/subscribers", icon: Users, label: "Subscribers" },
    { path: "/creator-studio/commissions", icon: PenTool, label: "Commissions" },
    { path: "/creator-studio/payouts", icon: DollarSign, label: "Payouts" },
    { path: "/creator-studio/settings", icon: Settings, label: "Creator Settings" },
  ];

  const handleNavClick = () => {
    if (onMobileNavClick) {
      onMobileNavClick();
    }
  };

  return (
    <div className="space-y-1 p-2">
      {!collapsed && (
        <div className="text-xs font-semibold text-muted-foreground mb-2 px-2">
          CREATOR STUDIO
        </div>
      )}
      {creatorItems.map((item) => (
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
