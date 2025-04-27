
import { Link, useLocation } from 'react-router-dom';
import { 
  GalleryHorizontal,
  Users2,
  Bell,
  ShoppingCart,
  Settings
} from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';

export function NavigationMenu() {
  const location = useLocation();
  
  const navigationItems = [
    { icon: GalleryHorizontal, label: 'Explore', path: '/explore' },
    { icon: Users2, label: 'Community', path: '/community' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
    { icon: ShoppingCart, label: 'Purchases', path: '/purchases' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <SidebarMenu>
      {navigationItems.map((item) => (
        <SidebarMenuItem key={item.path}>
          <SidebarMenuButton
            asChild
            isActive={location.pathname === item.path}
          >
            <Link 
              to={item.path}
              className="w-full flex items-center gap-3 px-3 py-2"
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
