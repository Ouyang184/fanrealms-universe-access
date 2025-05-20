
import { Link, useLocation } from 'react-router-dom';
import { 
  Grid, 
  FileText, 
  Mail, 
  Award, 
  UserCheck, 
  DollarSign, 
  Settings,
  ChevronDown 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface CreatorStudioMenuProps {
  collapsed: boolean;
}

export function CreatorStudioMenu({ collapsed }: CreatorStudioMenuProps) {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const studioItems = [
    { path: "/creator-studio/dashboard", icon: Grid, label: "Dashboard" },
    { path: "/creator-studio/posts", icon: FileText, label: "Posts" },
    { path: "/creator-studio/messages", icon: Mail, label: "Messages" },
    { path: "/creator-studio/membership-tiers", icon: Award, label: "Membership Tiers" },
    { path: "/creator-studio/subscribers", icon: UserCheck, label: "Subscribers" },
    { path: "/creator-studio/payouts", icon: DollarSign, label: "Payouts" },
    { path: "/creator-studio/settings", icon: Settings, label: "Creator Settings" },
  ];

  if (collapsed) {
    return (
      <div className="p-2">
        {studioItems.map((item) => (
          <Link to={item.path} key={item.path}>
            <Button 
              variant="ghost" 
              className="w-full justify-center px-2"
            >
              <item.icon className="h-5 w-5" />
            </Button>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="px-2">
      <Collapsible defaultOpen>
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
