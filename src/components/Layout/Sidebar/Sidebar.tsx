
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { SidebarHeader } from "./SidebarHeader";
import { MainNavigation } from "./MainNavigation";
import { CreatorStudioMenu } from "./CreatorStudioMenu";
import { SidebarFooter } from "./SidebarFooter";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarProps {
  collapsed: boolean;
  toggleSidebar: () => void;
  onSignOut: () => void;
}

export function Sidebar({ collapsed, toggleSidebar, onSignOut }: SidebarProps) {
  const isMobile = useIsMobile();
  
  // On mobile, sidebar should be overlay or completely hidden
  if (isMobile) {
    return null; // Could implement a mobile drawer here if needed
  }

  return (
    <div
      className={cn(
        "border-r border-border flex flex-col transition-all duration-300 ease-in-out bg-black flex-shrink-0",
        collapsed ? "w-16" : "w-72",
      )}
    >
      <SidebarHeader collapsed={collapsed} onToggle={toggleSidebar} />

      <ScrollArea className="flex-1 overflow-hidden">
        <MainNavigation collapsed={collapsed} />

        <Separator className="my-4" />

        <CreatorStudioMenu collapsed={collapsed} />
      </ScrollArea>

      <SidebarFooter collapsed={collapsed} onSignOut={onSignOut} />
    </div>
  );
}
