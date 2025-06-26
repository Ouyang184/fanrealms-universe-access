
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Heart, MessageSquare, TrendingUp } from 'lucide-react';
import { useCreatorDashboard } from '@/hooks/useCreatorDashboard';

export function ContentPerformanceCard() {
  const { posts, isLoading } = useCreatorDashboard();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Content Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalViews = posts?.reduce((sum, post) => {
    // Safely handle view count that might be a function return type
    const viewCount = typeof post.viewCount === 'number' ? post.viewCount : 0;
    return sum + viewCount;
  }, 0) || 0;

  const totalLikes = posts?.reduce((sum, post) => sum + (post.likes || 0), 0) || 0;
  const totalComments = posts?.reduce((sum, post) => sum + (post.comment_count || 0), 0) || 0;

  const topPost = posts?.reduce((best, current) => {
    const currentViews = typeof current.viewCount === 'number' ? current.viewCount : 0;
    const bestViews = typeof best.viewCount === 'number' ? best.viewCount : 0;
    return currentViews > bestViews ? current : best;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Content Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Eye className="h-4 w-4" />
              <span className="text-sm">Views</span>
            </div>
            <p className="text-2xl font-bold">{Number(totalViews).toLocaleString()}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Heart className="h-4 w-4" />
              <span className="text-sm">Likes</span>
            </div>
            <p className="text-2xl font-bold">{totalLikes.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm">Comments</span>
            </div>
            <p className="text-2xl font-bold">{totalComments.toLocaleString()}</p>
          </div>
        </div>

        {/* Top Performing Post */}
        {topPost && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Top Performing Post</h4>
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="font-medium truncate">{topPost.title}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {Number(typeof topPost.viewCount === 'number' ? topPost.viewCount : 0).toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {topPost.likes || 0}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {topPost.comment_count || 0}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
