
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatRelativeDate } from "@/utils/auth-helpers";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { CreatorsSection } from "@/components/dashboard/CreatorsSection";
import { PostsSection } from "@/components/dashboard/PostsSection";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("feed");
  
  // Fetch user's posts
  const { 
    data: posts = [], 
    isLoading: isLoadingPosts,
  } = useQuery({
    queryKey: ['userPosts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data: userPosts, error } = await supabase
        .from('posts')
        .select(`
          *,
          users:author_id (
            username,
            profile_picture
          )
        `)
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching posts:', error);
        toast({
          title: "Error fetching posts",
          description: "Failed to load your posts. Please try again.",
          variant: "destructive"
        });
        return [];
      }

      return userPosts.map((post: any) => ({
        ...post,
        authorName: post.users.username,
        authorAvatar: post.users.profile_picture,
        date: formatRelativeDate(post.created_at)
      }));
    },
    enabled: !!user?.id
  });

  // Query to check if user is a creator
  const { 
    data: creatorProfile,
    isLoading: isLoadingCreator
  } = useQuery({
    queryKey: ['userCreator', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('creators')
        .select(`
          *,
          membership_tiers (
            id,
            title,
            description,
            price
          )
        `)
        .eq('user_id', user.id)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking creator status:', error);
        toast({
          title: "Error",
          description: "Failed to load creator profile. Please try again.",
          variant: "destructive"
        });
        return null;
      }
      
      return data;
    },
    enabled: !!user?.id
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center py-20">
          <h2 className="text-2xl font-semibold mb-4">Please sign in</h2>
          <p className="text-muted-foreground mb-6">You need to be signed in to view your dashboard.</p>
          <Button asChild>
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  if (isLoadingPosts || isLoadingCreator) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <CreatorsSection />
        <PostsSection 
          posts={posts}
          isLoading={isLoadingPosts}
          isCreator={!!creatorProfile}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>
    </div>
  );
}
