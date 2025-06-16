
import { MainLayout } from "@/components/main-layout"
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
      
      const { data: tiers, error: tiersError } = await supabase
        .from('membership_tiers')
        .select('*')
        .eq('creator_id', creatorProfile.id)
        .order('price', { ascending: true });
        
      if (tiersError) throw tiersError;
      
      const tiersWithRealCounts = tiers.map(tier => {
        const tierSubscribers = subscribers?.filter(sub => 
          sub.tier_id === tier.id && sub.status === 'active'
        ) || [];
        
        const subscriberCount = tierSubscribers.length;
        const revenue = subscriberCount * (tier.price || 0);
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
      });
      
      return tiersWithRealCounts;
    },
    enabled: !!creatorProfile?.id && !!subscribers,
    staleTime: 300000,
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
