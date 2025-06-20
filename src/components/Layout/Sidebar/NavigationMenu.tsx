
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
  
  console.log('NavigationMenu - Detailed unread count calculation:', {
    followedCreators: followedCreators.length,
    followedCreatorUserIds,
    allPostsCount: posts?.length || 0,
    followedPostsCount: followedPosts.length,
    followedPostTitles: followedPosts.map(p => p.title),
    readPostsArray: Array.from(readPosts),
    readPostsSize: readPosts.size,
    unreadCount,
    currentUser: user?.id,
    currentPath: location.pathname
  });
  
  // Debug individual posts
  followedPosts.forEach(post => {
    console.log(`Post "${post.title}" (${post.id}): isRead=${readPosts.has(post.id)}, authorId=${post.authorId}`);
  });
  
  // Update read posts when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      console.log('NavigationMenu - Storage change detected');
      setReadPosts(getReadPostsFromStorage());
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for localStorage updates within the same tab
    const interval = setInterval(() => {
      const newReadPosts = getReadPostsFromStorage();
      if (newReadPosts.size !== readPosts.size) {
        console.log('NavigationMenu - Local storage update detected via interval');
        setReadPosts(newReadPosts);
      }
    }, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [readPosts.size]);
  
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
