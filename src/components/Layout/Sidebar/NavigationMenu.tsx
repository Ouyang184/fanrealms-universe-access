
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
import { useEffect, useState } from 'react';
import { usePosts } from '@/hooks/usePosts';
import { useFollows } from '@/hooks/useFollows';

interface NavigationMenuProps {
  collapsed?: boolean;
}

// Helper function to load read posts from localStorage synchronously
const getReadPostsFromStorage = (): Set<string> => {
  try {
    const savedReadPosts = localStorage.getItem('readPosts');
    if (savedReadPosts) {
      return new Set(JSON.parse(savedReadPosts));
    }
  } catch (error) {
    console.error('Error loading read posts from localStorage:', error);
  }
  return new Set();
};

export function NavigationMenu({ collapsed = false }: NavigationMenuProps) {
  const location = useLocation();
  const { user } = useAuth();
  const { data: posts } = usePosts();
  const { data: followedCreators = [] } = useFollows();
  const [readPosts, setReadPosts] = useState<Set<string>>(() => getReadPostsFromStorage());
  
  // Calculate unread posts count
  const followedCreatorUserIds = followedCreators.map(creator => creator.user_id).filter(Boolean);
  const followedPosts = posts?.filter(post => followedCreatorUserIds.includes(post.authorId)) || [];
  const unreadCount = followedPosts.filter(post => !readPosts.has(post.id)).length;
  
  // Update read posts when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setReadPosts(getReadPostsFromStorage());
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for localStorage updates within the same tab
    const interval = setInterval(() => {
      setReadPosts(getReadPostsFromStorage());
    }, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);
  
  const navigationItems = [
    { icon: Home, label: 'Home', path: user ? '/home' : '/' },
    { icon: Rss, label: 'Feed', path: '/feed', badge: unreadCount > 0 ? unreadCount : null },
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
                  "w-full flex items-center py-2.5 relative",
                  collapsed ? "px-2 justify-center" : "px-4 gap-3",
                  isActive && "bg-primary/30 font-medium"
                )}
              >
                <item.icon className="h-5 w-5" />
                {!collapsed && <span className="text-base">{item.label}</span>}
                {item.badge && item.badge > 0 && (
                  <span className={cn(
                    "bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center",
                    collapsed ? "absolute -top-1 -right-1" : "ml-auto"
                  )}>
                    {item.badge > 9 ? '9+' : item.badge}
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
