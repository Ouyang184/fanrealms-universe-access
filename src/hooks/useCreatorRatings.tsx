import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface CreatorRating {
  id: string;
  user_id: string;
  creator_id: string;
  rating: number;
  review_text?: string;
  rating_type: string;
  created_at: string;
  updated_at: string;
  user?: {
    username: string;
    profile_picture?: string;
  };
}

export interface RatingStats {
  average: number;
  count: number;
  distribution: { [key: number]: number };
}

export function useCreatorRatings(creatorId: string, ratingType: string = 'general') {
  const [ratings, setRatings] = useState<CreatorRating[]>([]);
  const [stats, setStats] = useState<RatingStats>({ average: 0, count: 0, distribution: {} });
  const [userRating, setUserRating] = useState<CreatorRating | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canRate, setCanRate] = useState(false);
  const { user } = useAuth();

  const fetchRatings = async () => {
    if (!creatorId) return;

    try {
      // First fetch ratings
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('creator_ratings')
        .select('*')
        .eq('creator_id', creatorId)
        .eq('rating_type', ratingType)
        .order('created_at', { ascending: false });

      if (ratingsError) throw ratingsError;

      // Then fetch user data for each rating
      const ratingsWithUsers = await Promise.all(
        (ratingsData || []).map(async (rating) => {
          const { data: userData } = await supabase
            .from('users')
            .select('username, profile_picture')
            .eq('id', rating.user_id)
            .single();
          
          return {
            ...rating,
            user: userData || { username: 'Anonymous', profile_picture: null }
          };
        })
      );

      setRatings(ratingsWithUsers);

      // Calculate stats
      if (ratingsData && ratingsData.length > 0) {
        const total = ratingsData.reduce((sum, r) => sum + r.rating, 0);
        const average = total / ratingsData.length;
        const distribution = ratingsData.reduce((acc, r) => {
          acc[r.rating] = (acc[r.rating] || 0) + 1;
          return acc;
        }, {} as { [key: number]: number });

        setStats({
          average: Math.round(average * 10) / 10,
          count: ratingsData.length,
          distribution
        });
      } else {
        setStats({ average: 0, count: 0, distribution: {} });
      }

      // Find user's rating
      const userRatingData = ratingsWithUsers?.find(r => r.user_id === user?.id);
      setUserRating(userRatingData || null);

    } catch (error) {
      console.error('Error fetching ratings:', error);
      toast({
        title: "Error",
        description: "Failed to load ratings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkCanRate = async () => {
    if (!user || !creatorId) {
      setCanRate(false);
      return;
    }

    try {
      // Check if user has subscription or commission history
      const [subscriptionsResult, commissionsResult] = await Promise.all([
        supabase
          .from('user_subscriptions')
          .select('id')
          .eq('user_id', user.id)
          .eq('creator_id', creatorId)
          .eq('status', 'active')
          .maybeSingle(),
        supabase
          .from('commission_requests')
          .select('id')
          .eq('customer_id', user.id)
          .eq('creator_id', creatorId)
          .maybeSingle()
      ]);

      const hasSubscription = !!subscriptionsResult.data;
      const hasCommission = !!commissionsResult.data;
      
      setCanRate(hasSubscription || hasCommission);
    } catch (error) {
      console.error('Error checking rating eligibility:', error);
      setCanRate(false);
    }
  };

  const submitRating = async (rating: number, reviewText?: string) => {
    if (!user || !creatorId) {
      toast({
        title: "Error",
        description: "You must be logged in to rate",
        variant: "destructive",
      });
      return false;
    }

    if (!canRate) {
      toast({
        title: "Error",
        description: "You must have an active subscription or commission history to rate this creator",
        variant: "destructive",
      });
      return false;
    }

    try {
      const ratingData = {
        user_id: user.id,
        creator_id: creatorId,
        rating,
        review_text: reviewText || null,
        rating_type: ratingType
      };

      if (userRating) {
        // Update existing rating
        const { error } = await supabase
          .from('creator_ratings')
          .update(ratingData)
          .eq('id', userRating.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Your rating has been updated",
        });
      } else {
        // Create new rating
        const { error } = await supabase
          .from('creator_ratings')
          .insert(ratingData);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Your rating has been submitted",
        });
      }

      // Refresh ratings
      await fetchRatings();
      return true;
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        title: "Error",
        description: "Failed to submit rating",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteRating = async () => {
    if (!userRating) return false;

    try {
      const { error } = await supabase
        .from('creator_ratings')
        .delete()
        .eq('id', userRating.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your rating has been deleted",
      });

      await fetchRatings();
      return true;
    } catch (error) {
      console.error('Error deleting rating:', error);
      toast({
        title: "Error",
        description: "Failed to delete rating",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchRatings();
    checkCanRate();
  }, [creatorId, ratingType, user]);

  return {
    ratings,
    stats,
    userRating,
    isLoading,
    canRate,
    submitRating,
    deleteRating,
    refetch: fetchRatings
  };
}