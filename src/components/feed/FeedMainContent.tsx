
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FeedPostItem } from "./FeedPostItem";
import { FeedEmpty } from "./FeedEmpty";
import { EmptyFeed } from "./EmptyFeed";
import { ServiceNotificationBanner } from "./ServiceNotificationBanner";
import { Post } from "@/types";
import { useSavedPosts } from "@/hooks/useSavedPosts";

interface FeedMainContentProps {
  hasFollowedCreators: boolean;
  hasPendingCancellations: boolean;
  followedPosts: Post[];
  unreadPosts: Post[];
  unreadCount: number;
  readPostIds: Set<string>;
  markAsRead: (postId: string) => void;
  creatorInfoMap: Record<string, any>;
  onPostClick?: (post: Post) => void;
}

export const FeedMainContent: React.FC<FeedMainContentProps> = ({
  hasFollowedCreators,
  hasPendingCancellations,
  followedPosts,
  unreadPosts,
  unreadCount,
  readPostIds,
  markAsRead,
  creatorInfoMap,
  onPostClick
}) => {
  const hasPosts = followedPosts.length > 0;
  const { savedPosts, isLoading: savedPostsLoading } = useSavedPosts();
  
  // Transform saved posts to match Post interface
  const savedPostsFormatted = savedPosts.map(saved => {
    const post = saved.posts;
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      createdAt: post.created_at,
      date: post.created_at,
      authorId: post.author_id,
      authorName: post.creators?.display_name || post.users?.username || '',
      authorAvatar: post.creators?.profile_image_url || post.users?.profile_picture,
      tier_id: post.tier_id,
      attachments: post.attachments,
      tags: post.tags,
      is_nsfw: post.is_nsfw
    };
  });

  if (!hasFollowedCreators) {
    return <EmptyFeed />;
  }

  return (
    <div className="w-full max-w-full">
      {/* Service Notification Banner */}
      <ServiceNotificationBanner hasPendingCancellations={hasPendingCancellations} />

      {/* Feed Tabs */}
      <Tabs defaultValue="all" className="mb-6 lg:mb-8 w-full">
        <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start p-0 h-auto overflow-x-auto">
          <div className="flex min-w-max">
            <TabsTrigger 
              value="all"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 py-2 text-sm whitespace-nowrap"
            >
              All Posts
            </TabsTrigger>
            <TabsTrigger 
              value="unread"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 py-2 text-sm whitespace-nowrap"
            >
              Unread
              {unreadCount > 0 && (
                <Badge className="ml-2 bg-red-500 h-5 min-w-[20px] px-1 text-xs">{unreadCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="saved"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 py-2 text-sm whitespace-nowrap"
            >
              Saved
            </TabsTrigger>
          </div>
        </TabsList>

        {/* All Posts Tab */}
        <TabsContent value="all" className="mt-4 lg:mt-6 space-y-4 lg:space-y-6">
          {!hasPosts ? (
            <div className="text-center py-8 lg:py-10">
              <p className="text-muted-foreground">No posts from creators you follow yet.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Posts will appear here when creators you follow publish new content.
              </p>
            </div>
          ) : (
            <div className="space-y-4 lg:space-y-6">
              {followedPosts.map((post) => (
                <FeedPostItem
                  key={post.id}
                  post={post}
                  readPostIds={readPostIds}
                  markAsRead={markAsRead}
                  creatorInfo={creatorInfoMap[post.authorId]}
                  onPostClick={onPostClick}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Unread Tab */}
        <TabsContent value="unread" className="mt-4 lg:mt-6 space-y-4 lg:space-y-6">
          {unreadCount > 0 ? (
            <div className="space-y-4 lg:space-y-6">
              {unreadPosts.map((post) => (
                <FeedPostItem
                  key={post.id}
                  post={post}
                  readPostIds={readPostIds}
                  markAsRead={markAsRead}
                  creatorInfo={creatorInfoMap[post.authorId]}
                  onPostClick={onPostClick}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 lg:py-10">
              <p className="text-muted-foreground">No unread posts from creators you follow.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Check back later or explore new creators to follow.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Saved Tab */}
        <TabsContent value="saved" className="mt-4 lg:mt-6 space-y-4 lg:space-y-6">
          {savedPostsLoading ? (
            <div className="text-center py-8 lg:py-10">
              <p className="text-muted-foreground">Loading saved posts...</p>
            </div>
          ) : savedPostsFormatted.length > 0 ? (
            <div className="space-y-4 lg:space-y-6">
              {savedPostsFormatted.map((post) => (
                <FeedPostItem
                  key={post.id}
                  post={post}
                  readPostIds={readPostIds}
                  markAsRead={markAsRead}
                  creatorInfo={creatorInfoMap[post.authorId]}
                  onPostClick={onPostClick}
                />
              ))}
            </div>
          ) : (
            <FeedEmpty />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
