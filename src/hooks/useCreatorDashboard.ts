
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
        authorId: post.author_id,
        authorName: post.users?.username || 'Unknown',
        authorAvatar: post.users?.profile_picture || null,
        createdAt: post.created_at,
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
  
  // Fetch active subscriptions data from user_subscriptions table
  const { data: subscriptionData = { current: 0, previous: 0, total: 0 }, isLoading: isLoadingSubscribers } = useQuery({
    queryKey: ['creator-active-subscriptions', creatorProfile?.id],
    queryFn: async () => {
      if (!creatorProfile?.id) return { current: 0, previous: 0, total: 0 };
      
      console.log('[Dashboard] Fetching active subscriptions for creator:', creatorProfile.id);
      
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const firstDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      
      // Get all active subscriptions (including those scheduled to cancel but still in period)
      const { data: activeSubscriptions, error: activeError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('creator_id', creatorProfile.id)
        .eq('status', 'active');
        
      if (activeError) {
        console.error('Error fetching active subscriptions:', activeError);
        return { current: 0, previous: 0, total: 0 };
      }
      
      console.log('[Dashboard] Found active subscriptions:', activeSubscriptions?.length || 0);
      
      // Filter out subscriptions that are scheduled to cancel and past their period end
      const now_timestamp = new Date().getTime();
      const trulyActiveSubscriptions = activeSubscriptions?.filter(sub => {
        // If not scheduled to cancel, it's active
        if (!sub.cancel_at_period_end) return true;
        
        // If scheduled to cancel, check if still within period
        if (sub.current_period_end) {
          const periodEnd = new Date(sub.current_period_end).getTime();
          return periodEnd > now_timestamp;
        }
        
        return true; // Keep if no period end data
      }) || [];
      
      console.log('[Dashboard] Truly active subscriptions after filtering:', trulyActiveSubscriptions.length);
      
      // Current month subscribers (created this month and still active)
      const currentMonthSubs = trulyActiveSubscriptions.filter(sub => 
        new Date(sub.created_at) >= new Date(firstDayOfMonth)
      );
      
      // Previous month subscribers (created last month)
      const { count: previousCount, error: previousError } = await supabase
        .from('user_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', creatorProfile.id)
        .eq('status', 'active')
        .gte('created_at', firstDayOfPrevMonth)
        .lt('created_at', firstDayOfMonth);
        
      if (previousError) {
        console.error('Error fetching previous month subscribers:', previousError);
      }
      
      const result = {
        current: currentMonthSubs.length,
        previous: previousCount || 0,
        total: trulyActiveSubscriptions.length
      };
      
      console.log('[Dashboard] Subscription data calculated:', result);
      return result;
    },
    enabled: !!creatorProfile?.id,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
  
  // Calculate tier performance with real subscriber counts and revenue
  const { data: tierPerformance = [], isLoading: isLoadingTierPerformance } = useQuery({
    queryKey: ['creator-tier-performance', creatorProfile?.id, tiers],
    queryFn: async () => {
      if (!creatorProfile?.id || !tiers.length) return [];
      
      console.log('[Dashboard] Calculating tier performance for', tiers.length, 'tiers');
      
      const tierPromises = tiers.map(async (tier) => {
        // Get active subscriptions for this tier
        const { data: tierSubscriptions, error: tierError } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('creator_id', creatorProfile.id)
          .eq('tier_id', tier.id)
          .eq('status', 'active');
          
        if (tierError) {
          console.error('Error fetching tier subscriptions:', tierError);
          return {
            id: tier.id,
            name: tier.title,
            price: Number(tier.price),
            subscribers: 0,
            previousSubscribers: 0,
            growth: 0,
            percentage: 0,
            revenue: 0,
            revenueChange: 0
          };
        }
        
        // Filter out cancelled subscriptions that are past their period
        const now_timestamp = new Date().getTime();
        const activeTierSubs = tierSubscriptions?.filter(sub => {
          if (!sub.cancel_at_period_end) return true;
          if (sub.current_period_end) {
            const periodEnd = new Date(sub.current_period_end).getTime();
            return periodEnd > now_timestamp;
          }
          return true;
        }) || [];
        
        console.log('[Dashboard] Tier', tier.title, 'has', activeTierSubs.length, 'active subscribers');
        
        // Calculate revenue from actual subscription amounts
        const revenue = activeTierSubs.reduce((total, sub) => {
          return total + (Number(sub.amount) || Number(tier.price));
        }, 0);
        
        // Get previous month data for growth calculation
        const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        const { count: prevMonthCount, error: prevError } = await supabase
          .from('user_subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('creator_id', creatorProfile.id)
          .eq('tier_id', tier.id)
          .eq('status', 'active')
          .lt('created_at', firstDayOfMonth);
          
        const previousSubscribers = prevError ? 0 : (prevMonthCount || 0);
        const subscribers = activeTierSubs.length;
        const percentage = subscriptionData.total > 0 ? Math.round((subscribers / subscriptionData.total) * 100) : 0;
        const growth = previousSubscribers > 0 
          ? Math.round(((subscribers - previousSubscribers) / previousSubscribers) * 100)
          : subscribers > 0 ? 100 : 0;
          
        const prevRevenue = previousSubscribers * Number(tier.price);
        const revenueChange = revenue - prevRevenue;
        
        return {
          id: tier.id,
          name: tier.title,
          price: Number(tier.price),
          subscribers,
          previousSubscribers,
          growth,
          percentage,
          revenue,
          revenueChange
        };
      });
      
      const results = await Promise.all(tierPromises);
      console.log('[Dashboard] Tier performance calculated:', results);
      return results;
    },
    enabled: !!creatorProfile?.id && !!tiers.length && !!subscriptionData,
    refetchInterval: 30000, // Refetch every 30 seconds
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
      percentage: Math.abs(subscriberPercentage),
      trend: subscriberChange >= 0 ? "up" : "down"
    },
    revenue: {
      total: currentRevenue,
      change: Math.abs(revenueChange),
      percentage: Math.abs(revenuePercentage),
      trend: revenueChange >= 0 ? "up" : "down"
    }
  };

  console.log('[Dashboard] Final stats calculated:', stats);

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
