
import { useState } from 'react';
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NavigationMenu } from "./NavigationMenu";
import { CreatorStudioMenu } from "./CreatorStudioMenu";
import { SidebarFooterContent } from "./SidebarFooterContent";
import { Separator } from "@/components/ui/separator";

interface SidebarProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ sidebarCollapsed, setSidebarCollapsed }: SidebarProps) {
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div
      className={cn(
        "border-r border-border flex flex-col transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "w-16" : "w-72",
      )}
    >
      {/* Logo */}
      <div className={cn("p-4 flex items-center", sidebarCollapsed ? "justify-center" : "justify-start")}>
        <Logo collapsed={sidebarCollapsed} onClick={toggleSidebar} />
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          <NavigationMenu isCollapsed={sidebarCollapsed} />
        </div>

        <Separator className="my-4" />

        {sidebarCollapsed ? (
          <CreatorStudioMenu isCollapsed={true} />
        ) : (
          <CreatorStudioMenu isCollapsed={false} />
        )}
      </ScrollArea>

      <SidebarFooterContent isCollapsed={sidebarCollapsed} />
    </div>
  );
}
