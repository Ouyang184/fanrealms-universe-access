import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { 
  Sidebar, 
  SidebarHeader, 
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar
} from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NavigationMenu } from './Sidebar/NavigationMenu';
import { CreatorStudioMenu } from './Sidebar/CreatorStudioMenu';
import { SidebarFooterContent } from './Sidebar/SidebarFooterContent';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Logo } from '@/components/Logo';

export function AppSidebar() {
  const { loading, signOut } = useAuth();
  const { state, toggleSidebar } = useSidebar();
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
            <NavigationMenu isCollapsed={isCollapsed} />
            
            <SidebarSeparator className="my-3" />
            
            <CreatorStudioMenu isCollapsed={isCollapsed} />

            <SidebarSeparator className="my-3" />

            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={signOut} 
                  className={cn(
                    "w-full justify-start py-2.5",
                    isCollapsed ? "px-2" : "px-4"
                  )}
                  tooltip={isCollapsed ? "Logout" : undefined}
                >
                  {isCollapsed ? (
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  ) : (
                    <>
                      <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
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
        <SidebarFooterContent isCollapsed={isCollapsed} />
      </SidebarFooter>
    </Sidebar>
  );
}
