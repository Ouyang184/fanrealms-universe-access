
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PostCard from "@/components/PostCard";
import type { Post } from "@/types";

interface PostsSectionProps {
  posts: Post[];
  isCreator: boolean;
  activeTab: string;
  setActiveTab: (value: string) => void;
}

export function PostsSection({ posts, isCreator, activeTab, setActiveTab }: PostsSectionProps) {
  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Recent Posts</h2>
        {isCreator && (
          <Button asChild>
            <Link to="/create-post">Create Post</Link>
          </Button>
        )}
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="feed">Your Feed</TabsTrigger>
          <TabsTrigger value="your-posts">Your Posts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="feed" className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.length > 0 ? (
              posts.map((post) => (
                <PostCard key={post.id} {...post} />
              ))
            ) : (
              <div className="col-span-2">
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground mb-4">No posts in your feed yet.</p>
                    <p className="text-sm text-muted-foreground">
                      Follow some creators to see their posts here!
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="your-posts" className="pt-6">
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts.map((post) => (
                <PostCard key={post.id} {...post} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground mb-4">
                  {isCreator 
                    ? "You haven't created any posts yet." 
                    : "You need to be a creator to create posts."}
                </p>
                {isCreator && (
                  <Button asChild>
                    <Link to="/create-post">Create Your First Post</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}
