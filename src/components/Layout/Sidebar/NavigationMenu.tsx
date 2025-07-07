
import { Link, useLocation } from 'react-router-dom';
import { 
  GalleryHorizontal,
  MessageSquare,
  ShoppingCart,
  Settings,
  Home,
  Rss,
  Users,
  FileText
} from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { usePosts } from '@/hooks/usePosts';
import { useFollows } from '@/hooks/useFollows';
import { usePostReads } from '@/hooks/usePostReads';

interface NavigationMenuProps {
  collapsed?: boolean;
  onMobileNavClick?: () => void;
}

export function NavigationMenu({ collapsed = false, onMobileNavClick }: NavigationMenuProps) {
  const location = useLocation();
  const { user } = useAuth();
  const { data: posts } = usePosts();
  const { data: followedCreators = [] } = useFollows();
  const { readPostIds } = usePostReads();
  
  // Calculate unread posts count using database data
  const followedCreatorUserIds = followedCreators.map(creator => creator.user_id).filter(Boolean);
  const followedPosts = posts?.filter(post => followedCreatorUserIds.includes(post.authorId)) || [];
  const unreadCount = followedPosts.filter(post => !readPostIds.has(post.id)).length;
  
  const navigationItems = [
    { icon: Home, label: 'Home', path: user ? '/home' : '/' },
    { icon: Rss, label: 'Feed', path: '/feed', badge: unreadCount > 0 ? unreadCount : null },
    { icon: Users, label: 'Following', path: '/following' },
    { icon: GalleryHorizontal, label: 'Explore', path: '/explore' },
    { icon: MessageSquare, label: 'Direct Messages', path: '/messages' },
    { icon: FileText, label: 'Requests', path: '/requests' },
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
                onClick={onMobileNavClick}
                className={cn(
                  "w-full flex items-center py-2.5 relative",
                  collapsed ? "px-2 justify-center" : "px-4 gap-3",
                  isActive && "bg-primary/30 font-medium"
                )}
              >
                <item.icon className="h-5 w-5" />
                {!collapsed && <span className="text-base">{item.label}</span>}
                {item.badge && item.badge > 0 && (
                  <span className={cn(
                    "bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 font-bold border-2 border-white shadow-lg",
                    collapsed ? "absolute -top-1 -right-1" : "ml-auto"
                  )}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
