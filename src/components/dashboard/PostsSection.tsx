
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PostCard } from "@/components/PostCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { formatRelativeDate } from "@/utils/auth-helpers";

export function PostsSection() {
  const { user } = useAuth();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['user-posts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          users:author_id (
            username,
            profile_picture
          )
        `)
        .eq('author_id', user.id as any)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching posts:', error);
        return [];
      }
      
      return data.map((post: any) => ({
        ...post,
        authorId: post.author_id,
        authorName: post.users?.username || 'Unknown',
        authorAvatar: post.users?.profile_picture,
        date: formatRelativeDate(post.created_at)
      }));
    },
    enabled: !!user?.id
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">You haven't created any posts yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <PostCard 
          key={post.id} 
          post={{
            ...post,
            comment_count: post.comment_count || 0
          }}
        />
      ))}
    </div>
  );
}
