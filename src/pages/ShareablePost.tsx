
import React, { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSimpleSubscriptionCheck } from '@/hooks/useSimpleSubscriptionCheck';
import { PostCard } from '@/components/PostCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Lock, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { usePostViewTracking } from '@/hooks/usePostViews';

export default function ShareablePost() {
  const { creatorSlug, postId } = useParams<{ creatorSlug: string; postId: string }>();
  const { user } = useAuth();
  const { recordView } = usePostViewTracking();

  // Fetch the post data
  const { data: post, isLoading, error } = useQuery({
    queryKey: ['shareablePost', postId],
    queryFn: async () => {
      if (!postId) return null;

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          users:author_id (
            username,
            profile_picture
          ),
          membership_tiers (
            id,
            title,
            price
          )
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;

      return {
        ...data,
        authorId: data.author_id,
        authorName: data.users?.username || 'Creator',
        authorAvatar: data.users?.profile_picture,
        date: new Date(data.created_at).toLocaleDateString(),
        createdAt: data.created_at
      };
    },
    enabled: !!postId
  });

  // Track view when post loads
  useEffect(() => {
    if (post?.id) {
      recordView(post.id, 'read');
    }
  }, [post?.id, recordView]);

  const { subscriptionData } = useSimpleSubscriptionCheck(post?.tier_id || undefined, post?.authorId);
  
  const isOwnPost = user?.id === post?.authorId;
  const hasAccess = isOwnPost || !post?.tier_id || subscriptionData?.isSubscribed;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <h1 className="text-2xl font-bold">Post Not Found</h1>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              The post you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link to="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user has access, show the full post
  if (hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <PostCard post={post} />
        </div>
      </div>
    );
  }

  // If it's a private post and user doesn't have access, show preview
  const previewContent = post.content.length > 150 
    ? post.content.substring(0, 150) + "..." 
    : post.content;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50/30 to-purple-50/30">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-5 w-5 text-purple-600" />
              <span className="font-semibold text-purple-800">Premium Content Preview</span>
            </div>
            <h1 className="text-2xl font-bold">{post.title}</h1>
            <p className="text-muted-foreground">by {post.authorName}</p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <p className="text-gray-700">{previewContent}</p>
            
            <div className="p-4 bg-gradient-to-r from-amber-50 to-purple-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 text-amber-800 mb-3">
                <Lock className="h-5 w-5 text-purple-600" />
                <span className="font-semibold">This is Premium Content</span>
              </div>
              <p className="text-sm text-amber-700 mb-3">
                Subscribe to unlock the full post and get access to exclusive content from this creator.
              </p>
              
              <div className="flex gap-2">
                <Button className="bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-700 hover:to-amber-700 text-white">
                  <Lock className="h-4 w-4 mr-2" />
                  Subscribe to Unlock
                </Button>
                
                {!user && (
                  <Button variant="outline" asChild>
                    <Link to="/login">Sign In</Link>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
