
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { Post, DbCreator } from "@/types";
import { formatRelativeDate } from "@/utils/auth-helpers";
import { useIsMobile } from "@/hooks/use-mobile";

export function useCreatorDashboard() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
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
  
  // Fetch subscribers count (current and previous month)
  const { data: subscriptionData = { current: 0, previous: 0 }, isLoading: isLoadingSubscribers } = useQuery({
    queryKey: ['creator-subscribers-data', creatorProfile?.id],
    queryFn: async () => {
      if (!creatorProfile?.id) return { current: 0, previous: 0 };
      
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const firstDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const lastDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();
      
      // Current month subscribers
      const { count: currentCount, error: currentError } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', creatorProfile.id)
        .gte('created_at', firstDayOfMonth);
        
      // Previous month subscribers
      const { count: previousCount, error: previousError } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', creatorProfile.id)
        .gte('created_at', firstDayOfPrevMonth)
        .lt('created_at', firstDayOfMonth);
        
      // Total subscribers (all time)
      const { count: totalCount, error: totalError } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', creatorProfile.id);
        
      if (currentError || previousError || totalError) {
        console.error('Error fetching subscribers data:', { currentError, previousError, totalError });
        return { current: 0, previous: 0, total: 0 };
      }
      
      return { 
        current: currentCount || 0, 
        previous: previousCount || 0,
        total: totalCount || 0
      };
    },
    enabled: !!creatorProfile?.id
  });
  
  // Calculate tier performance with subscriber counts
  const { data: tierPerformance = [], isLoading: isLoadingTierPerformance } = useQuery({
    queryKey: ['creator-tier-performance', creatorProfile?.id, tiers],
    queryFn: async () => {
      if (!creatorProfile?.id || !tiers.length) return [];
      
      const tierPromises = tiers.map(async (tier) => {
        // Current month subscribers for this tier
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const firstDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
        
        const { count: currentSubscribers, error: currentError } = await supabase
          .from('subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('creator_id', creatorProfile.id)
          .eq('tier_id', tier.id);
          
        const { count: prevMonthSubscribers, error: prevError } = await supabase
          .from('subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('creator_id', creatorProfile.id)
          .eq('tier_id', tier.id)
          .lt('created_at', firstDayOfMonth);
          
        if (currentError || prevError) {
          console.error('Error fetching tier subscribers:', { currentError, prevError });
          return {
            ...tier,
            subscribers: 0,
            percentage: 0,
            revenue: 0,
            previousSubscribers: 0,
            growth: 0,
            name: tier.title
          };
        }
        
        const subscribers = currentSubscribers || 0;
        const previousSubscribers = prevMonthSubscribers || 0;
        const subscribersTotal = subscriptionData.total || subscribers;
        const percentage = subscribersTotal > 0 ? Math.round((subscribers / subscribersTotal) * 100) : 0;
        const revenue = Number(tier.price) * subscribers;
        const prevRevenue = Number(tier.price) * previousSubscribers;
        const revenueChange = revenue - prevRevenue;
        
        return {
          id: tier.id,
          name: tier.title,
          price: Number(tier.price),
          subscribers,
          previousSubscribers,
          growth: previousSubscribers > 0 
            ? Math.round(((subscribers - previousSubscribers) / previousSubscribers) * 100)
            : subscribers > 0 ? 100 : 0,
          percentage,
          revenue,
          revenueChange
        };
      });
      
      return Promise.all(tierPromises);
    },
    enabled: !!creatorProfile?.id && !!tiers.length && !!subscriptionData
  });

  // Calculate actual stats based on real data
  const currentMonthSubscribers = subscriptionData.current || 0;
  const previousMonthSubscribers = subscriptionData.previous || 0;
  const subscriberChange = currentMonthSubscribers - previousMonthSubscribers;
  const subscriberPercentage = previousMonthSubscribers > 0 
    ? Math.round(((currentMonthSubscribers - previousMonthSubscribers) / previousMonthSubscribers) * 100) 
    : currentMonthSubscribers > 0 ? 100 : 0;
  
  const currentRevenue = tierPerformance.reduce((acc, tier) => acc + tier.revenue, 0);
  const previousRevenue = tierPerformance.reduce((acc, tier) => acc + (tier.revenue - tier.revenueChange), 0);
  const revenueChange = currentRevenue - previousRevenue;
  const revenuePercentage = previousRevenue > 0 
    ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
    : currentRevenue > 0 ? 100 : 0;

  // Format stats for display
  const stats = {
    subscribers: {
      total: subscriptionData.total || 0,
      change: subscriberChange,
      percentage: subscriberPercentage,
      trend: subscriberChange >= 0 ? "up" : "down"
    },
    revenue: {
      total: currentRevenue,
      change: Math.abs(revenueChange),
      percentage: Math.abs(revenuePercentage),
      trend: revenueChange >= 0 ? "up" : "down"
    }
  };

  const isLoading = isLoadingProfile || isLoadingPosts || isLoadingTiers || 
                    isLoadingSubscribers || isLoadingTierPerformance;
  
  return {
    creatorProfile,
    posts,
    stats,
    tierPerformance,
    isLoading,
    isMobile
  };
}
