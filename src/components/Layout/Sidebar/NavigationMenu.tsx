
import { Link, useLocation } from 'react-router-dom';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';

export function NavigationMenu() {
  const location = useLocation();
  
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton 
          asChild
          isActive={location.pathname === '/explore'}
          tooltip="Explore"
        >
          <Link to="/explore">Explore</Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      
      <SidebarMenuItem>
        <SidebarMenuButton 
          asChild
          isActive={location.pathname === '/community'}
          tooltip="Community"
        >
          <Link to="/community">Community</Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      
      <SidebarMenuItem>
        <SidebarMenuButton 
          asChild
          isActive={location.pathname === '/notifications'}
          tooltip="Notifications"
        >
          <Link to="/notifications">Notifications</Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      
      <SidebarMenuItem>
        <SidebarMenuButton 
          asChild
          isActive={location.pathname === '/purchases'}
          tooltip="Purchases"
        >
          <Link to="/purchases">Purchases</Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      
      <SidebarMenuItem>
        <SidebarMenuButton 
          asChild
          isActive={location.pathname === '/settings'}
          tooltip="Settings"
        >
          <Link to="/settings">Settings</Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
