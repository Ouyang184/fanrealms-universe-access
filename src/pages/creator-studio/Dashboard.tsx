
import { MainLayout } from "@/components/Layout/MainLayout"
import { CreatorCheck } from "@/components/creator-studio/CreatorCheck"
import { useCreatorDashboard } from "@/hooks/useCreatorDashboard"
import { useCreatorSubscribers } from "@/hooks/useCreatorSubscribers"
import { useCreatorPosts } from "@/hooks/useCreatorPosts"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"
import LoadingSpinner from "@/components/LoadingSpinner"
import { DashboardHeader } from "@/components/creator-studio/dashboard/DashboardHeader"
import { StatsCards } from "@/components/creator-studio/dashboard/StatsCards"
import { ContentPerformanceCard } from "@/components/creator-studio/dashboard/ContentPerformanceCard"
import { ContentCalendarCard } from "@/components/creator-studio/dashboard/ContentCalendarCard"
import { MembershipTiersCard } from "@/components/creator-studio/dashboard/MembershipTiersCard"
import { useDashboardStats } from "@/hooks/useDashboardStats"

export default function Dashboard() {
  const { user } = useAuth();
  const { creatorProfile, posts, isLoading: dashboardLoading } = useCreatorDashboard();
  const { posts: creatorPosts, isLoading: isLoadingPosts } = useCreatorPosts();
  
  const { subscribers, isLoading: subscribersLoading } = useCreatorSubscribers(creatorProfile?.id || '');
  
  const { data: tiersWithCounts = [], isLoading: tiersLoading } = useQuery({
    queryKey: ['dashboard-tiers-with-counts', creatorProfile?.id],
    queryFn: async () => {
      if (!creatorProfile?.id) return [];
      
      console.log('[Dashboard] Fetching tiers for creator:', creatorProfile.id);
      
      const { data: tiers, error: tiersError } = await supabase
        .from('membership_tiers')
        .select('*')
        .eq('creator_id', creatorProfile.id)
        .eq('active', true)
        .order('price', { ascending: true });
        
      if (tiersError) {
        console.error('[Dashboard] Error fetching tiers:', tiersError);
        throw tiersError;
      }
      
      console.log('[Dashboard] Found tiers:', tiers?.length || 0);
      
      // Get accurate subscriber counts by fetching actual records instead of using count
      const tiersWithRealCounts = await Promise.all(tiers.map(async (tier) => {
        console.log('[Dashboard] Counting subscribers for tier:', tier.id, tier.title);
        
        try {
          // Fetch actual subscription records instead of using count
          const { data: subscriptions, error: subscriptionsError } = await supabase
            .from('user_subscriptions')
            .select('id, user_id, status')
            .eq('tier_id', tier.id)
            .eq('creator_id', creatorProfile.id)
            .eq('status', 'active');

          if (subscriptionsError) {
            console.error('[Dashboard] Error fetching subscribers for tier:', tier.id, subscriptionsError);
            return {
              id: tier.id,
              name: tier.title,
              title: tier.title,
              price: Number(tier.price),
              subscribers: 0,
              percentage: 0,
              revenue: 0,
              revenueChange: 0,
              previousSubscribers: 0,
              growth: 0,
            };
          }

          const subscriberCount = subscriptions?.length || 0;
          console.log('[Dashboard] Tier', tier.title, 'has', subscriberCount, 'active subscribers');
          console.log('[Dashboard] Subscription records for tier', tier.title, ':', subscriptions);
          
          const revenue = subscriberCount * (tier.price || 0);
          
          // Calculate percentage of total active subscribers
          const totalActiveSubscribers = subscribers?.filter(sub => sub.status === 'active').length || 0;
          const percentage = totalActiveSubscribers > 0 ? Math.round((subscriberCount / totalActiveSubscribers) * 100) : 0;
          
          return {
            id: tier.id,
            name: tier.title,
            title: tier.title,
            price: Number(tier.price),
            subscribers: subscriberCount,
            percentage,
            revenue,
            revenueChange: 0,
            previousSubscribers: 0,
            growth: 0,
          };
        } catch (error) {
          console.error('[Dashboard] Error processing tier:', tier.id, error);
          return {
            id: tier.id,
            name: tier.title,
            title: tier.title,
            price: Number(tier.price),
            subscribers: 0,
            percentage: 0,
            revenue: 0,
            revenueChange: 0,
            previousSubscribers: 0,
            growth: 0,
          };
        }
      }));
      
      console.log('[Dashboard] Final tiers with subscriber counts:', tiersWithRealCounts);
      return tiersWithRealCounts;
    },
    enabled: !!creatorProfile?.id,
    staleTime: 30000,
    refetchInterval: 60000, // Refetch every minute to keep counts updated
  });

  const monthlyStats = useDashboardStats(subscribers);
  const isLoading = dashboardLoading || subscribersLoading || tiersLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <CreatorCheck>
      <div className="max-w-7xl mx-auto">
        <DashboardHeader />
        <StatsCards monthlyStats={monthlyStats} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ContentPerformanceCard posts={posts} />
            <ContentCalendarCard creatorPosts={creatorPosts} />
          </div>

          <div className="space-y-6">
            <MembershipTiersCard tiersWithCounts={tiersWithCounts} />
          </div>
        </div>
      </div>
    </CreatorCheck>
  )
}
