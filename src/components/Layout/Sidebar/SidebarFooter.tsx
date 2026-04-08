
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarFooterProps {
  collapsed: boolean;
  onSignOut: () => void;
}

export function SidebarFooter({ collapsed, onSignOut }: SidebarFooterProps) {
  return (
    <div className={cn("border-t border-border", collapsed ? "p-2" : "p-3")}>
      <button
        className={cn(
          "flex items-center gap-3 w-full px-2 py-1.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors",
          collapsed && "justify-center"
        )}
        onClick={onSignOut}
      >
        <LogOut className="h-4 w-4" />
        {!collapsed && <span>Logout</span>}
      </button>
    </div>
  );
}
