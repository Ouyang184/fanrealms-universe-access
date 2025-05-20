
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarFooterProps {
  collapsed: boolean;
  onSignOut: () => void;
}

export function SidebarFooter({ collapsed, onSignOut }: SidebarFooterProps) {
  return (
    <div className={cn("border-t border-border", collapsed ? "p-2" : "p-4")}>
      <Button
        variant="ghost"
        className={cn("w-full text-muted-foreground", collapsed ? "justify-center px-2" : "justify-start gap-3")}
        onClick={onSignOut}
      >
        <LogOut className="h-5 w-5" />
        {!collapsed && <span>Logout</span>}
      </Button>
    </div>
  );
}
