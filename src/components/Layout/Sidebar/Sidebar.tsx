
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { SidebarHeader } from "./SidebarHeader";
import { MainNavigation } from "./MainNavigation";
import { CreatorStudioMenu } from "./CreatorStudioMenu";
import { SidebarFooter } from "./SidebarFooter";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  collapsed: boolean;
  toggleSidebar: () => void;
  onSignOut: () => void;
}

export function Sidebar({ collapsed, toggleSidebar, onSignOut }: SidebarProps) {
  const isMobile = useIsMobile();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const SidebarContent = () => (
    <>
      <SidebarHeader collapsed={collapsed} onToggle={toggleSidebar} />

      <div className="flex-1 overflow-y-auto">
        <MainNavigation collapsed={collapsed} />

        <Separator className="my-4" />

        <CreatorStudioMenu collapsed={collapsed} />
      </div>

      <SidebarFooter collapsed={collapsed} onSignOut={onSignOut} />
    </>
  );

  // On mobile, use a drawer
  if (isMobile) {
    return (
      <Drawer open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
        <DrawerTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="fixed top-3 left-3 z-50 bg-background/80 backdrop-blur-sm border"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="h-[85vh]">
          <div className="flex flex-col h-full bg-black text-foreground">
            <SidebarContent />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop sidebar
  return (
    <div
      className={cn(
        "border-r border-border flex flex-col transition-all duration-300 ease-in-out bg-black flex-shrink-0",
        collapsed ? "w-16" : "w-72",
      )}
    >
      <SidebarContent />
    </div>
  );
}
