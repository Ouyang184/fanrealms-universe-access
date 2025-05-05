
import { useEffect } from "react";
import { MainLayout } from "@/components/Layout/MainLayout";
import { usePosts } from "@/hooks/usePosts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PostCard from "@/components/PostCard";
import { Users } from "lucide-react";

// Sample creators you follow
const followedCreators = [
  {
    id: 1,
    name: "Digital Art Master",
    username: "artmaster",
    avatar: "/placeholder.svg?height=50&width=50",
    description: "Digital art tutorials, character design, and concept art resources",
    subscribers: 15420,
    posts: 127,
  },
  {
    id: 2,
    name: "Game Development Pro",
    username: "gamedevpro",
    avatar: "/placeholder.svg?height=50&width=50",
    description: "Unity tutorials, game development tips, and asset creation guides",
    subscribers: 8320,
    posts: 89,
  },
  {
    id: 3,
    name: "Music Production Studio",
    username: "musicstudio",
    avatar: "/placeholder.svg?height=50&width=50",
    description: "Music production techniques, sample packs, and mixing tutorials",
    subscribers: 12150,
    posts: 156,
  },
];

export default function Following() {
  // Set document title when component mounts
  useEffect(() => {
    document.title = "Following | Creator Platform";
  }, []);

  const { data: posts, isLoading } = usePosts();

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto p-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Following</h1>
          <p className="text-muted-foreground">Manage creators you follow and discover their content</p>
        </div>

        <Tabs defaultValue="creators">
          <TabsList>
            <TabsTrigger value="creators">Creators</TabsTrigger>
            <TabsTrigger value="latest">Latest Posts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="creators" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {followedCreators.map((creator) => (
                <Card key={creator.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={creator.avatar} alt={creator.name} />
                        <AvatarFallback>{creator.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <Button variant="outline" size="sm">Unfollow</Button>
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg">{creator.name}</h3>
                      <p className="text-sm text-muted-foreground">@{creator.username}</p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">{creator.description}</p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{creator.subscribers.toLocaleString()} Subscribers</span>
                      </div>
                      <div>
                        <span>{creator.posts} Posts</span>
                      </div>
                    </div>
                    <Button className="w-full">View Profile</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="latest" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isLoading ? (
                Array(4).fill(0).map((_, index) => (
                  <PostCard key={index} isLoading={true} id="" title="" content="" authorName="" authorAvatar="" created_at="" date="" tier_id={null} />
                ))
              ) : posts && posts.length > 0 ? (
                posts.map((post) => (
                  <PostCard key={post.id} {...post} />
                ))
              ) : (
                <div className="col-span-2 text-center py-12">
                  <p className="text-muted-foreground mb-4">No posts from your followed creators yet.</p>
                  <Button>Explore Creators</Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
