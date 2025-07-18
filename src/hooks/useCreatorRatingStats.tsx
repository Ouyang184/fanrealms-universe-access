import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CreatorRatingStats {
  creator_id: string;
  average_rating: number;
  total_ratings: number;
}

export function useCreatorRatingStats(creatorIds: string[]) {
  const [stats, setStats] = useState<Record<string, CreatorRatingStats>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRatingStats = async () => {
      if (!creatorIds.length) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch all ratings for the given creators
        const { data: ratings, error } = await supabase
          .from('creator_ratings')
          .select('creator_id, rating')
          .in('creator_id', creatorIds);

        if (error) throw error;

        // Calculate stats for each creator
        const statsMap: Record<string, CreatorRatingStats> = {};
        
        creatorIds.forEach(creatorId => {
          const creatorRatings = ratings?.filter(r => r.creator_id === creatorId) || [];
          
          if (creatorRatings.length > 0) {
            const totalRating = creatorRatings.reduce((sum, r) => sum + r.rating, 0);
            const average = totalRating / creatorRatings.length;
            
            statsMap[creatorId] = {
              creator_id: creatorId,
              average_rating: Math.round(average * 10) / 10,
              total_ratings: creatorRatings.length
            };
          } else {
            statsMap[creatorId] = {
              creator_id: creatorId,
              average_rating: 0,
              total_ratings: 0
            };
          }
        });

        setStats(statsMap);
      } catch (error) {
        console.error('Error fetching creator rating stats:', error);
        // Set empty stats for all creators on error
        const emptyStats: Record<string, CreatorRatingStats> = {};
        creatorIds.forEach(id => {
          emptyStats[id] = { creator_id: id, average_rating: 0, total_ratings: 0 };
        });
        setStats(emptyStats);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRatingStats();
  }, [creatorIds]);

  return { stats, isLoading };
}