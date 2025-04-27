import { MainLayout } from "@/components/Layout/MainLayout";
import { useAuthCheck } from "@/lib/hooks/useAuthCheck";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ContentCard } from "@/components/ContentCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";

declare module '@/lib/supabase' {
  interface Profile {
    bio?: string;
  }
}

export default function Profile() {
  const { isChecking } = useAuthCheck();
  const { user, profile } = useAuth();
  
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  
  const userPosts = [
    {
      id: 1,
      title: "My Experience with Digital Art",
      description: "Here's a quick overview of my journey with digital art, including the tools I use and techniques I've learned along the way.",
      image: "https://picsum.photos/seed/user1/800/450",
      authorName: profile?.full_name || user?.email?.split('@')[0] || "User",
      authorAvatar: profile?.avatar_url || undefined,
      date: "1 week ago"
    },
    {
      id: 2,
      title: "Productivity Tips for Content Creators",
      description: "After years of creating content, I've learned some valuable lessons about staying productive. Here are my top tips for fellow creators.",
      image: "https://picsum.photos/seed/user2/800/450",
      authorName: profile?.full_name || user?.email?.split('@')[0] || "User",
      authorAvatar: profile?.avatar_url || undefined,
      date: "2 weeks ago"
    }
  ];
  
  return (
    <MainLayout>
      <div className="space-y-8">
        <Card className="overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/40"></div>
          <CardContent className="relative pt-0">
            <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-end -mt-16 mb-6">
              <Avatar className="h-32 w-32 border-4 border-background">
                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "User"} />
                <AvatarFallback className="text-4xl bg-primary/20 text-primary">
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col sm:flex-row w-full justify-between items-center gap-4">
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl font-bold">
                    {profile?.full_name || user?.email?.split('@')[0] || "User"}
                  </h1>
                  <p className="text-muted-foreground">
                    @{profile?.username || user?.email?.split('@')[0] || "username"}
                  </p>
                </div>
                <Button variant="outline" asChild size="sm">
                  <Link to="/settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Edit Profile
                  </Link>
                </Button>
              </div>
            </div>
            
            {profile?.website && (
              <div className="mb-4 text-center sm:text-left">
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {profile.website}
                </a>
              </div>
            )}
            
            <div className="flex justify-center sm:justify-start gap-8 pb-2">
              <div className="text-center">
                <p className="font-semibold">2</p>
                <p className="text-sm text-muted-foreground">Posts</p>
              </div>
              <div className="text-center">
                <p className="font-semibold">142</p>
                <p className="text-sm text-muted-foreground">Followers</p>
              </div>
              <div className="text-center">
                <p className="font-semibold">24</p>
                <p className="text-sm text-muted-foreground">Following</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="posts" className="w-full">
          <TabsList>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="collections">Collections</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>
          <div className="mt-6">
            <TabsContent value="posts" className="m-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userPosts.map((post) => (
                  <ContentCard 
                    key={post.id}
                    title={post.title}
                    description={post.description}
                    image={post.image}
                    authorName={post.authorName}
                    authorAvatar={post.authorAvatar}
                    date={post.date}
                  />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="collections" className="m-0">
              <Card>
                <CardContent className="py-10 text-center">
                  <p className="text-muted-foreground">You haven't created any collections yet.</p>
                  <Button className="mt-4">Create Collection</Button>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="about" className="m-0">
              <Card>
                <CardContent className="py-6">
                  <h3 className="font-semibold mb-2">About Me</h3>
                  <p className="text-muted-foreground">
                    {profile?.bio || "No bio provided yet. Edit your profile to add more information about yourself."}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </MainLayout>
  );
}
