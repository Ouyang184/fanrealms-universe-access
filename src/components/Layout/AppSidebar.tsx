
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
import { useNavigate } from 'react-router-dom';

export function AppSidebar() {
  const { loading, signOut } = useAuth();
  const { state, toggleSidebar } = useSidebar();
  const isMobile = useIsMobile();
  const [initialRender, setInitialRender] = useState(true);
  const navigate = useNavigate();

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

  const handleLogout = async () => {
    // Use navigate directly to logout page which will handle the signout process
    navigate('/logout');
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
            <NavigationMenu isCollapsed={isCollapsed} />
            
            <SidebarSeparator className="my-3" />
            
            <CreatorStudioMenu isCollapsed={isCollapsed} />

            <SidebarSeparator className="my-3" />

            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleLogout} 
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
        <SidebarFooterContent isCollapsed={isCollapsed} />
      </SidebarFooter>
    </Sidebar>
  );
}
