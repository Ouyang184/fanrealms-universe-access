
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/Layout/MainLayout";
import PostCard from "@/components/PostCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatRelativeDate } from "@/utils/auth-helpers";
import type { DbPost, Post } from "@/types";

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: posts = [], isLoading } = useQuery({
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
        return [];
      }

      return userPosts.map((post: any) => ({
        ...post,
        authorName: post.users.username,
        authorAvatar: post.users.profile_picture,
        date: formatRelativeDate(post.created_at)
      })) as Post[];
    },
    enabled: !!user?.id
  });
  
  return (
    <MainLayout showTabs={true}>
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Your Feed</h1>
          <p className="text-muted-foreground">Latest updates from creators you follow</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isLoading ? (
            <>
              <PostCard isLoading={true} id={0} title="" description="" image="" authorName="" authorAvatar="" date="" />
              <PostCard isLoading={true} id={0} title="" description="" image="" authorName="" authorAvatar="" date="" />
            </>
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <PostCard 
                key={post.id}
                id={Number(post.id)}
                title={post.title}
                description={post.content}
                image="https://picsum.photos/seed/post1/800/450" // Placeholder for now
                authorName={post.authorName}
                authorAvatar={post.authorAvatar || ''}
                date={post.date}
              />
            ))
          ) : (
            <div className="col-span-2 text-center py-12">
              <p className="text-muted-foreground">No posts yet. Create your first post!</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
