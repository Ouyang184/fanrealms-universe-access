
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Sidebar, 
  SidebarHeader, 
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';

import { NavigationMenu } from './Sidebar/NavigationMenu';
import { CreatorStudioMenu } from './Sidebar/CreatorStudioMenu';
import { SidebarFooterContent } from './Sidebar/SidebarFooterContent';

export function AppSidebar() {
  const { loading, signOut } = useAuth();

  if (loading) {
    return <div>Loading sidebar...</div>;
  }

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader>
        <div className="flex items-center justify-center p-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span className="text-primary text-xl">FanRealms</span>
          </Link>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="flex-1">
        <ScrollArea className="h-full scrollbar-none">
          <div className="pb-6">
            <NavigationMenu />
            
            <SidebarSeparator />
            
            <CreatorStudioMenu />

            <SidebarSeparator />

            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={signOut} tooltip="Logout">
                  Logout
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
        </ScrollArea>
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarFooterContent />
      </SidebarFooter>
    </Sidebar>
  );
}
