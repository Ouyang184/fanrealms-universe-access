
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const useViewTracking = () => {
  const { user } = useAuth();
  const [trackingViews, setTrackingViews] = useState<Set<string>>(new Set());

  const trackView = async (postId: string) => {
    if (!user?.id || trackingViews.has(postId)) {
      return;
    }

    setTrackingViews(prev => new Set([...prev, postId]));

    try {
      console.log(`[useViewTracking] Tracking view for post ${postId} by user ${user.id}`);
      
      // Insert or update view record
      const { error } = await supabase
        .from('post_views')
        .upsert({
          post_id: postId,
          user_id: user.id,
          viewed_at: new Date().toISOString()
        }, {
          onConflict: 'post_id,user_id'
        });

      if (error) {
        console.error('[useViewTracking] Error tracking view:', error);
        // Don't show toast for view tracking errors to avoid spam
      } else {
        console.log(`[useViewTracking] Successfully tracked view for post ${postId}`);
      }
    } catch (error) {
      console.error('[useViewTracking] Unexpected error tracking view:', error);
    } finally {
      // Remove from tracking set after attempt
      setTrackingViews(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  return { trackView };
};
