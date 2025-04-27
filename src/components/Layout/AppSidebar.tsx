
import { Home, Compass, Users, Bell, ShoppingBag, Settings, Star, LogOut, Palette } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator
} from '@/components/ui/sidebar';

// Main navigation items
const mainNavItems = [
  { name: 'Home', path: '/dashboard', icon: Home },
  { name: 'Explore', path: '/explore', icon: Compass },
  { name: 'Community', path: '/community', icon: Users },
  { name: 'Notifications', path: '/notifications', icon: Bell },
  { name: 'Purchases', path: '/purchases', icon: ShoppingBag },
  { name: 'Settings', path: '/settings', icon: Settings },
];

// Example memberships - in a real app, these would come from an API
const membershipItems = [
  { id: 1, name: 'Creator Studio', path: '/creators/studio', image: '/placeholder.svg' },
  { id: 2, name: 'Art Community', path: '/creators/art', image: '/placeholder.svg' },
  { id: 3, name: 'Game Dev', path: '/creators/gamedev', image: '/placeholder.svg' },
];

export function AppSidebar() {
  const location = useLocation();
  const { signOut } = useAuth();
  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="p-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="font-bold text-xl gradient-text">FanRealms</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.path)}
                    tooltip={item.name}
                  >
                    <Link to={item.path} className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              {/* New Creator Studio Link */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname.startsWith('/creator-studio')}
                  tooltip="Creator Studio"
                >
                  <Link to="/creator-studio" className="flex items-center gap-3">
                    <Palette className="h-5 w-5" />
                    <span>Creator Studio</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Memberships Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            <span>My Memberships</span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {membershipItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.path)}
                    tooltip={item.name}
                  >
                    <Link to={item.path} className="flex items-center gap-3">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={item.image} alt={item.name} />
                        <AvatarFallback className="text-xs">
                          {item.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 mt-auto">
        <SidebarSeparator className="mb-4" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={signOut}
              size="sm"
              variant="outline"
              className="w-full text-muted-foreground hover:text-destructive"
              tooltip="Sign Out"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="text-xs text-muted-foreground mt-4">
          FanRealms © {new Date().getFullYear()}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
