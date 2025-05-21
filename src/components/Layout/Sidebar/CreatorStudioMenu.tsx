
import { Link, useLocation } from 'react-router-dom';
import { 
  Grid, 
  FileText, 
  Mail, 
  Award, 
  UserCheck, 
  DollarSign, 
  Settings,
  ChevronDown,
  PlusCircle,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";
import { useState, useEffect } from "react";

interface CreatorStudioMenuProps {
  collapsed: boolean;
}

export function CreatorStudioMenu({ collapsed }: CreatorStudioMenuProps) {
  const location = useLocation();
  const { creatorProfile, isLoading, setShowModal } = useCreatorProfile();
  const [isOpen, setIsOpen] = useState(true);
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Reset open state when creator status changes
  useEffect(() => {
    if (creatorProfile) {
      setIsOpen(true);
    }
  }, [creatorProfile]);

  const studioItems = [
    { path: "/creator-studio/dashboard", icon: Grid, label: "Dashboard" },
    { path: "/creator-studio/posts", icon: FileText, label: "Posts" },
    { path: "/creator-studio/messages", icon: Mail, label: "Messages" },
    { path: "/creator-studio/membership-tiers", icon: Award, label: "Membership Tiers" },
    { path: "/creator-studio/subscribers", icon: UserCheck, label: "Subscribers" },
    { path: "/creator-studio/payouts", icon: DollarSign, label: "Payouts" },
    { path: "/creator-studio/creator-profile", icon: User, label: "Creator Profile" },
    { path: "/creator-studio/settings", icon: Settings, label: "Creator Settings" },
  ];

  // If still loading, show a placeholder
  if (isLoading) {
    return null;
  }

  // Non-creator view
  if (!creatorProfile) {
    if (collapsed) {
      return (
        <div className="p-2">
          <Button 
            variant="ghost" 
            className="w-full justify-center px-2"
            onClick={() => setShowModal(true)}
          >
            <PlusCircle className="h-5 w-5" />
          </Button>
        </div>
      );
    }

    return (
      <div className="px-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 font-medium"
          onClick={() => setShowModal(true)}
        >
          <PlusCircle className="h-5 w-5" />
          Become a Creator
        </Button>
      </div>
    );
  }

  // Creator view with collapsed sidebar
  if (collapsed) {
    return (
      <div className="p-2">
        {studioItems.map((item) => (
          <Link to={item.path} key={item.path}>
            <Button 
              variant={isActive(item.path) ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-center px-2",
                isActive(item.path) && "bg-primary/30"
              )}
            >
              <item.icon className="h-5 w-5" />
            </Button>
          </Link>
        ))}
      </div>
    );
  }

  // Creator view with expanded sidebar
  return (
    <div className="px-2">
      <Collapsible defaultOpen={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex w-full items-center justify-between p-2 font-semibold text-lg">
          <div className="flex items-center gap-2">
            <span>Creator Studio</span>
          </div>
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-2 space-y-1">
          {studioItems.map((item) => (
            <Link to={item.path} key={item.path} className="block">
              <Button
                variant={isActive(item.path) ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 font-medium",
                  isActive(item.path) && "bg-primary/30",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Button>
            </Link>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
