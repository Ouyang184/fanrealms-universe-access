
import { Link, useLocation } from 'react-router-dom';
import { 
  GalleryHorizontal,
  MessageSquare,
  ShoppingCart,
  Settings,
  Home,
  Rss,
  Users
} from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface NavigationMenuProps {
  collapsed?: boolean;
}

export function NavigationMenu({ collapsed = false }: NavigationMenuProps) {
  const location = useLocation();
  const { user } = useAuth();
  
  const navigationItems = [
    { icon: Home, label: 'Home', path: user ? '/home' : '/' },
    { icon: Rss, label: 'Feed', path: '/feed' },
    { icon: Users, label: 'Following', path: '/following' },
    { icon: GalleryHorizontal, label: 'Explore', path: '/explore' },
    { icon: MessageSquare, label: 'Direct Messages', path: '/messages' },
    { icon: ShoppingCart, label: 'Purchases', path: '/purchases' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <SidebarMenu>
      {navigationItems.map((item) => {
        const isActive = location.pathname === item.path;
        
        return (
          <SidebarMenuItem key={item.path}>
            <SidebarMenuButton
              asChild
              isActive={isActive}
              tooltip={collapsed ? item.label : undefined}
            >
              <Link 
                to={item.path}
                className={cn(
                  "w-full flex items-center py-2.5",
                  collapsed ? "px-2 justify-center" : "px-4 gap-3",
                  isActive && "bg-primary/30 font-medium"
                )}
              >
                <item.icon className="h-5 w-5" />
                {!collapsed && <span className="text-base">{item.label}</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
