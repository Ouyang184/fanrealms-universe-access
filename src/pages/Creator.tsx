
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import LoadingSpinner from "@/components/LoadingSpinner";
import PostCard from "@/components/PostCard";
import { supabase } from "@/lib/supabase";
import { CreatorProfile, Post } from "@/types";

// Placeholder posts data for demo
const placeholderPosts = [
  {
    id: 1,
    title: "The Creative Process Behind My Latest Series",
    description: "A behind-the-scenes look at how I developed the concept and executed my most recent project.",
    image: "https://picsum.photos/seed/creator1/800/450",
    authorName: "Creative Studio",
    authorAvatar: "https://picsum.photos/seed/avatar1/100/100",
    date: "2 days ago"
  },
  {
    id: 2,
    title: "Monthly Q&A: Answering Your Top Questions",
    description: "In this monthly session, I address the most frequently asked questions from my community.",
    image: "https://picsum.photos/seed/creator2/800/450",
    authorName: "Creative Studio",
    authorAvatar: "https://picsum.photos/seed/avatar1/100/100",
    date: "1 week ago"
  },
];

const CreatorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [creator, setCreator] = useState<Partial<CreatorProfile> | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");
  
  useEffect(() => {
    const fetchCreatorProfile = async () => {
      setLoading(true);
      try {
        // In a real app, this would fetch from your Supabase profiles table
        // For now, we'll simulate a delay and return placeholder data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // This is where you would query Supabase for the real data
        // const { data, error } = await supabase
        //   .from('profiles')
        //   .select('*')
        //   .eq('username', id)
        //   .single();
        
        // if (error) throw error;
        
        const mockCreator = {
          id: "creator-123",
          username: id,
          full_name: "Creative Studio",
          avatar_url: "https://picsum.photos/seed/avatar1/100/100",
          website: "https://creativestudio.com",
          bio: "Digital artist and content creator specializing in motion graphics and visual effects. Sharing tutorials, behind-the-scenes content, and creative inspirations.",
          profile_completed: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setCreator(mockCreator);
        setPosts(placeholderPosts);
      } catch (error) {
        console.error("Error fetching creator profile:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchCreatorProfile();
    }
  }, [id]);
  
  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-[60vh]">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }
  
  if (!creator) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Creator Not Found</h2>
          <p className="text-muted-foreground mb-6">We couldn't find a creator with this username.</p>
          <Button asChild>
            <a href="/explore">Explore Creators</a>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Creator Header */}
        <div className="relative">
          <div className="h-48 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-lg overflow-hidden">
            {/* Creator Cover Image (if available) */}
          </div>
          <div className="flex flex-col md:flex-row items-center md:items-end p-4 -mt-16 md:-mt-12">
            <Avatar className="h-32 w-32 border-4 border-background">
              <AvatarImage src={creator.avatar_url || undefined} alt={creator.full_name || "Creator"} />
              <AvatarFallback className="text-4xl">
                {(creator.full_name || creator.username || "C").charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="mt-4 md:mt-0 md:ml-6 text-center md:text-left flex-1">
              <h1 className="text-3xl font-bold">{creator.full_name}</h1>
              <p className="text-muted-foreground">@{creator.username}</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button>Subscribe</Button>
            </div>
          </div>
        </div>
        
        {/* Creator Bio */}
        <div className="px-4">
          <p>{creator.bio}</p>
          {creator.website && (
            <a 
              href={creator.website} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-primary hover:underline mt-2 inline-block"
            >
              {creator.website}
            </a>
          )}
        </div>
        
        {/* Tabs */}
        <Tabs defaultValue="posts" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="membership">Membership</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts.map((post) => (
                <PostCard key={post.id} {...post} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="membership" className="pt-6">
            <div className="text-center p-8">
              <h3 className="text-xl font-semibold mb-2">Membership Tiers</h3>
              <p className="text-muted-foreground">Join this creator's community to unlock exclusive content and perks.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="about" className="pt-6">
            <div className="max-w-3xl mx-auto prose prose-sm">
              <h3 className="text-xl font-semibold mb-4">About {creator.full_name}</h3>
              <p className="text-muted-foreground">{creator.bio || "No information provided."}</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default CreatorPage;
