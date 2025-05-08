
import { useState } from 'react';
import { Link } from 'react-router-dom';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface CreatorStudioSectionProps {
  sidebarCollapsed: boolean;
  isActive: (path: string) => boolean;
}

export function CreatorStudioSection({ sidebarCollapsed, isActive }: CreatorStudioSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  
  if (sidebarCollapsed) {
    return (
      <div className="p-2">
        <Link to="/creator-studio/dashboard" className="block">
          <Button variant="ghost" className="w-full justify-center px-2">
            <Grid className="h-5 w-5" />
          </Button>
        </Link>
        <Link to="/creator-studio/posts" className="block">
          <Button variant="ghost" className="w-full justify-center px-2">
            <FileText className="h-5 w-5" />
          </Button>
        </Link>
        <Link to="/creator-studio/messages" className="block">
          <Button variant="ghost" className="w-full justify-center px-2">
            <Mail className="h-5 w-5" />
          </Button>
        </Link>
        <Link to="/creator-studio/membership-tiers" className="block">
          <Button variant="ghost" className="w-full justify-center px-2">
            <Award className="h-5 w-5" />
          </Button>
        </Link>
        <Link to="/creator-studio/subscribers" className="block">
          <Button variant="ghost" className="w-full justify-center px-2">
            <UserCheck className="h-5 w-5" />
          </Button>
        </Link>
        <Link to="/creator-studio/payouts" className="block">
          <Button variant="ghost" className="w-full justify-center px-2">
            <DollarSign className="h-5 w-5" />
          </Button>
        </Link>
        <Link to="/creator-studio/settings" className="block">
          <Button variant="ghost" className="w-full justify-center px-2">
            <Settings className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    );
  }
  
  return (
    <Collapsible defaultOpen className="px-2" open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between p-2 font-semibold text-lg">
        <div className="flex items-center gap-2">
          <span>Creator Studio</span>
        </div>
        <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", 
          isOpen && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-2 space-y-1">
        <Link to="/creator-studio/dashboard" className="block">
          <Button
            variant={isActive("/creator-studio/dashboard") ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-3 font-medium",
              isActive("/creator-studio/dashboard") && "bg-primary/30",
            )}
          >
            <Grid className="h-5 w-5" />
            Dashboard
          </Button>
        </Link>
        <Link to="/creator-studio/posts" className="block">
          <Button
            variant={isActive("/creator-studio/posts") ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-3 font-medium",
              isActive("/creator-studio/posts") && "bg-primary/30",
            )}
          >
            <FileText className="h-5 w-5" />
            Posts
          </Button>
        </Link>
        <Link to="/creator-studio/messages" className="block">
          <Button
            variant={isActive("/creator-studio/messages") ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-3 font-medium",
              isActive("/creator-studio/messages") && "bg-primary/30",
            )}
          >
            <Mail className="h-5 w-5" />
            Messages
          </Button>
        </Link>
        <Link to="/creator-studio/membership-tiers" className="block">
          <Button
            variant={isActive("/creator-studio/membership-tiers") ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-3 font-medium",
              isActive("/creator-studio/membership-tiers") && "bg-primary/30",
            )}
          >
            <Award className="h-5 w-5" />
            Membership Tiers
          </Button>
        </Link>
        <Link to="/creator-studio/subscribers" className="block">
          <Button
            variant={isActive("/creator-studio/subscribers") ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-3 font-medium",
              isActive("/creator-studio/subscribers") && "bg-primary/30",
            )}
          >
            <UserCheck className="h-5 w-5" />
            Subscribers
          </Button>
        </Link>
        <Link to="/creator-studio/payouts" className="block">
          <Button
            variant={isActive("/creator-studio/payouts") ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-3 font-medium",
              isActive("/creator-studio/payouts") && "bg-primary/30",
            )}
          >
            <DollarSign className="h-5 w-5" />
            Payouts
          </Button>
        </Link>
        <Link to="/creator-studio/settings" className="block">
          <Button
            variant={isActive("/creator-studio/settings") ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-3 font-medium",
              isActive("/creator-studio/settings") && "bg-primary/30",
            )}
          >
            <Settings className="h-5 w-5" />
            Creator Settings
          </Button>
        </Link>
      </CollapsibleContent>
    </Collapsible>
  );
}
