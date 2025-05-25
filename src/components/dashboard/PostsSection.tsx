import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PostCard from "@/components/PostCard";
import { CreatePostForm } from "./CreatePostForm";
import { ContentCardSkeleton } from "@/components/ContentCardSkeleton";
import type { Post } from "@/types";

interface PostsSectionProps {
  posts: Post[];
  isLoading?: boolean;
  isCreator: boolean;
  activeTab: string;
  setActiveTab: (value: string) => void;
}

export function PostsSection({ 
  posts, 
  isLoading = false, 
  isCreator, 
  activeTab, 
  setActiveTab 
}: PostsSectionProps) {
  const LoadingPosts = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[1, 2, 3, 4].map((n) => (
        <ContentCardSkeleton key={n} />
      ))}
    </div>
  );

  const EmptyState = ({ message, action }: { message: string, action?: React.ReactNode }) => (
    <Card className="w-full">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="relative w-24 h-24 mb-4 text-muted-foreground">
          <img
            src="/placeholder.svg"
            alt="No content"
            className="w-full h-full opacity-50"
          />
        </div>
        <p className="text-lg font-medium mb-2">No posts yet</p>
        <p className="text-muted-foreground mb-6">{message}</p>
        {action}
      </CardContent>
    </Card>
  );

  return (
    <section className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Recent Posts</h2>
        {isCreator && <CreatePostForm />}
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start mb-6">
          <TabsTrigger value="feed">Your Feed</TabsTrigger>
          <TabsTrigger value="your-posts">Your Posts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="feed" className="pt-6">
          {isLoading ? (
            <LoadingPosts />
          ) : posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts.map((post) => (
                <PostCard 
                  key={post.id} 
                  id={post.id}
                  title={post.title}
                  content={post.content}
                  authorName={post.authorName || 'Unknown'}
                  authorAvatar={post.authorAvatar}
                  createdAt={post.createdAt}
                  date={post.date || post.createdAt}
                  tier_id={post.tier_id}
                  attachments={post.attachments}
                  author_id={post.authorId}
                />
              ))}
            </div>
          ) : (
            <EmptyState 
              message="Follow some creators to see their posts here!"
              action={
                <Button asChild variant="outline">
                  <Link to="/explore">Discover Creators</Link>
                </Button>
              }
            />
          )}
        </TabsContent>
        
        <TabsContent value="your-posts" className="pt-6">
          {isLoading ? (
            <LoadingPosts />
          ) : posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts.map((post) => (
                <PostCard 
                  key={post.id} 
                  id={post.id}
                  title={post.title}
                  content={post.content}
                  authorName={post.authorName || 'Unknown'}
                  authorAvatar={post.authorAvatar}
                  createdAt={post.createdAt}
                  date={post.date || post.createdAt}
                  tier_id={post.tier_id}
                  attachments={post.attachments}
                  author_id={post.authorId}
                />
              ))}
            </div>
          ) : (
            <EmptyState 
              message={
                isCreator 
                  ? "Share your first post with your followers!"
                  : "Become a creator to start sharing posts."
              }
              action={
                isCreator ? (
                  <CreatePostForm />
                ) : (
                  <Button asChild>
                    <Link to="/settings">Become a Creator</Link>
                  </Button>
                )
              }
            />
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}
