
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FeedPostItem } from "./FeedPostItem";
import { FeedEmpty } from "./FeedEmpty";
import { EmptyFeed } from "./EmptyFeed";
import { ServiceNotificationBanner } from "./ServiceNotificationBanner";
import { Post } from "@/types";

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

  if (!hasFollowedCreators) {
    return <EmptyFeed />;
  }

  return (
    <>
      {/* Service Notification Banner */}
      <ServiceNotificationBanner hasPendingCancellations={hasPendingCancellations} />

      {/* Feed Tabs */}
      <Tabs defaultValue="all" className="mb-8">
        <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start p-0">
          <TabsTrigger 
            value="all"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
          >
            All Posts
          </TabsTrigger>
          <TabsTrigger 
            value="unread"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
          >
            Unread
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-red-500 h-5 min-w-[20px] px-1">{unreadCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="saved"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
          >
            Saved
          </TabsTrigger>
        </TabsList>

        {/* All Posts Tab */}
        <TabsContent value="all" className="mt-6 space-y-6">
          {!hasPosts ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No posts from creators you follow yet.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Posts will appear here when creators you follow publish new content.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
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
        <TabsContent value="unread" className="mt-6 space-y-6">
          {unreadCount > 0 ? (
            <div className="space-y-6">
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
            <div className="text-center py-10">
              <p className="text-muted-foreground">No unread posts from creators you follow.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Check back later or explore new creators to follow.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Saved Tab */}
        <TabsContent value="saved" className="mt-6">
          <FeedEmpty />
        </TabsContent>
      </Tabs>
    </>
  );
};
