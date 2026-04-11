
import { cn } from "@/lib/utils";
import { SidebarHeader } from "./SidebarHeader";
import { MainNavigation } from "./MainNavigation";
import { CreatorStudioMenu } from "./CreatorStudioMenu";
import { SidebarFooter } from "./SidebarFooter";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface SidebarProps {
  collapsed: boolean;
  toggleSidebar: () => void;
  onSignOut: () => void;
}

export function Sidebar({ collapsed, toggleSidebar, onSignOut }: SidebarProps) {
  const isMobile = useIsMobile();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef(0);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      scrollPositionRef.current = scrollContainerRef.current.scrollTop;
    }
  };

  useEffect(() => {
    if (scrollContainerRef.current && scrollPositionRef.current > 0) {
      scrollContainerRef.current.scrollTop = scrollPositionRef.current;
    }
  });

  const SidebarContent = () => (
    <>
      <SidebarHeader collapsed={collapsed} onToggle={toggleSidebar} />
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
        onScroll={handleScroll}
        style={{ scrollBehavior: 'auto' }}
      >
        <MainNavigation collapsed={collapsed} isMobile={isMobile} />
        <CreatorStudioMenu collapsed={collapsed} isMobile={isMobile} />
      </div>
      <SidebarFooter collapsed={collapsed} onSignOut={onSignOut} />
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
        <DrawerTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="fixed top-3 left-3 z-50"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="h-[85vh]">
          <div className="flex flex-col h-full bg-[#111] text-white">
            <SidebarContent />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col transition-all duration-300 ease-in-out bg-[#111] flex-shrink-0",
        collapsed ? "w-14" : "w-56",
      )}
    >
      <SidebarContent />
    </div>
  );
}
