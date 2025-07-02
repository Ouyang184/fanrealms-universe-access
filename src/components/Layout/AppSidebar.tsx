
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { 
  Sidebar, 
  SidebarHeader, 
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  useSidebar
} from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NavigationMenu } from './Sidebar/NavigationMenu';
import { CreatorStudioMenu } from './Sidebar/CreatorStudioMenu';
import { SidebarFooterContent } from './Sidebar/SidebarFooterContent';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Logo } from '@/components/Logo';

export function AppSidebar() {
  const { loading, signOut } = useAuth();
  const { state, toggleSidebar, setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();
  const [initialRender, setInitialRender] = useState(true);

  // Initialize sidebar state - collapsed on mobile, expanded on desktop
  useEffect(() => {
    if (initialRender && isMobile !== undefined) {
      if (isMobile) {
        // Force collapsed state on mobile
        toggleSidebar();
      }
      setInitialRender(false);
    }
  }, [isMobile, initialRender, toggleSidebar]);

  // Close mobile sidebar when clicking on navigation items
  const handleMobileNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  if (loading) {
    return <div>Loading sidebar...</div>;
  }

  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar 
      collapsible="icon" 
      className={cn(
        "border-r transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-[240px]"
      )}
    >
      <SidebarHeader className="flex items-center justify-between">
        <div className={cn(
          "flex items-center p-4 transition-all duration-300",
          isCollapsed ? "justify-center w-full" : "justify-between w-full"
        )}>
          <Logo collapsed={isCollapsed} onClick={toggleSidebar} />
        </div>
      </SidebarHeader>
      
      <SidebarContent className="flex-1">
        <ScrollArea className={cn(
          "h-full", 
          isCollapsed ? "sidebar-scrollbar-hidden" : "sidebar-scrollbar"
        )}>
          <div className={cn(
            "pb-6",
            isCollapsed ? "px-2" : "px-3"
          )}>
            <NavigationMenu collapsed={isCollapsed} onMobileNavClick={handleMobileNavClick} />
            
            <SidebarSeparator className="my-3" />
            
            <CreatorStudioMenu collapsed={isCollapsed} onMobileNavClick={handleMobileNavClick} />

            <SidebarSeparator className="my-3" />

            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => {
                    signOut();
                    if (isMobile) setOpenMobile(false);
                  }}
                  className={cn(
                    "w-full justify-start py-2.5",
                    isCollapsed ? "px-2" : "px-4"
                  )}
                  tooltip={isCollapsed ? "Logout" : undefined}
                >
                  {isCollapsed ? (
                    <LogOut className="h-5 w-5" />
                  ) : (
                    <>
                      <LogOut className="h-5 w-5 mr-2" />
                      <span className="text-base">Logout</span>
                    </>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
        </ScrollArea>
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarFooterContent collapsed={isCollapsed} />
      </SidebarFooter>
    </Sidebar>
  );
}
