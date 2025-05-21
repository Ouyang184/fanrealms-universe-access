
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { Post, DbCreator } from "@/types";
import { formatRelativeDate } from "@/utils/auth-helpers";

export function useCreatorDashboard() {
  const { user } = useAuth();
  
  // Fetch creator profile data
  const { data: creatorProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['creator-profile-dashboard', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('creators')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (error) {
        console.error('Error fetching creator profile:', error);
        return null;
      }
      
      return data as DbCreator;
    },
    enabled: !!user?.id
  });
  
  // Fetch creator's posts
  const { data: posts = [], isLoading: isLoadingPosts } = useQuery({
    queryKey: ['creator-posts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          users!posts_author_id_fkey (
            username,
            profile_picture
          )
        `)
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);
        
      if (error) {
        console.error('Error fetching posts:', error);
        toast({
          title: "Error fetching posts",
          description: "Failed to load your posts. Please try again.",
          variant: "destructive"
        });
        return [];
      }
      
      return data.map((post): Post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        authorName: post.users?.username || 'Unknown',
        authorAvatar: post.users?.profile_picture || null,
        created_at: post.created_at,
        date: formatRelativeDate(post.created_at),
        tier_id: post.tier_id
      }));
    },
    enabled: !!user?.id
  });
  
  // Fetch creator's membership tiers
  const { data: tiers = [], isLoading: isLoadingTiers } = useQuery({
    queryKey: ['creator-tiers-dashboard', creatorProfile?.id],
    queryFn: async () => {
      if (!creatorProfile?.id) return [];
      
      const { data, error } = await supabase
        .from('membership_tiers')
        .select('*')
        .eq('creator_id', creatorProfile.id)
        .order('price', { ascending: true });
        
      if (error) {
        console.error('Error fetching tiers:', error);
        return [];
      }
      
      return data;
    },
    enabled: !!creatorProfile?.id
  });
  
  // Fetch subscribers count
  const { data: subscribersCount = 0, isLoading: isLoadingSubscribers } = useQuery({
    queryKey: ['creator-subscribers-count', creatorProfile?.id],
    queryFn: async () => {
      if (!creatorProfile?.id) return 0;
      
      const { count, error } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', creatorProfile.id);
        
      if (error) {
        console.error('Error fetching subscribers count:', error);
        return 0;
      }
      
      return count || 0;
    },
    enabled: !!creatorProfile?.id
  });
  
  // Calculate tier performance with subscriber counts
  const { data: tierPerformance = [], isLoading: isLoadingTierPerformance } = useQuery({
    queryKey: ['creator-tier-performance', creatorProfile?.id],
    queryFn: async () => {
      if (!creatorProfile?.id || !tiers.length) return [];
      
      const tierPromises = tiers.map(async (tier) => {
        const { count, error } = await supabase
          .from('subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('creator_id', creatorProfile.id)
          .eq('tier_id', tier.id);
          
        if (error) {
          console.error('Error fetching tier subscribers:', error);
          return {
            ...tier,
            subscribers: 0,
            percentage: 0,
            revenue: 0
          };
        }
        
        const subscribers = count || 0;
        const percentage = subscribersCount > 0 ? Math.round((subscribers / subscribersCount) * 100) : 0;
        const revenue = Number(tier.price) * subscribers;
        
        return {
          name: tier.title,
          price: Number(tier.price),
          subscribers,
          percentage,
          revenue
        };
      });
      
      return Promise.all(tierPromises);
    },
    enabled: !!creatorProfile?.id && !!tiers.length && subscribersCount > 0
  });
  
  // Mock stats based on real data
  const stats = {
    subscribers: {
      total: subscribersCount,
      change: Math.round(subscribersCount * 0.1), // Simulate 10% growth
      percentage: 5.2,
      trend: "up"
    },
    revenue: {
      total: tierPerformance.reduce((acc, tier) => acc + tier.revenue, 0),
      change: 512.25,
      percentage: 8.7,
      trend: "up"
    }
  };

  const isLoading = isLoadingProfile || isLoadingPosts || isLoadingTiers || 
                    isLoadingSubscribers || isLoadingTierPerformance;
  
  return {
    creatorProfile,
    posts,
    stats,
    tierPerformance,
    isLoading
  };
}
