
import { Button } from "@/components/ui/button";
import { SearchBar } from "./SearchBar";
import { HeaderNotifications } from "./HeaderNotifications";
import { UserDropdownMenu } from "./UserDropdownMenu";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Rss } from "lucide-react";
import { usePosts } from "@/hooks/usePosts";
import { useFollows } from "@/hooks/useFollows";
import { usePostReads } from "@/hooks/usePostReads";

export function Header() {
  const { user } = useAuth();
  const { data: posts } = usePosts();
  const { data: followedCreators = [] } = useFollows();
  const { readPostIds } = usePostReads();
  
  // Calculate unread posts count for feed icon
  let unreadCount = 0;
  if (user && posts && followedCreators.length > 0) {
    const followedCreatorUserIds = followedCreators.map(creator => creator.user_id).filter(Boolean);
    const followedPosts = posts.filter(post => followedCreatorUserIds.includes(post.authorId));
    unreadCount = followedPosts.filter(post => !readPostIds.has(post.id)).length;
  }
  
  return (
    <header className="border-b border-border bg-background z-10">
      <div className="flex items-center justify-between p-4">
        <SearchBar />

        {/* Top Right Icons */}
        <div className="flex items-center gap-4 ml-4">
          <HeaderNotifications />
          
          {user && (
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative" asChild>
              <Link to="/feed">
                <Rss className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
                <span className="sr-only">Feed</span>
              </Link>
            </Button>
          )}
          
          {user ? (
            <UserDropdownMenu />
          ) : (
            <Button asChild variant="default">
              <Link to="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
