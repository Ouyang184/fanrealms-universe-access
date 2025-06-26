
import { useCreatorDashboard } from "@/hooks/useCreatorDashboard";
import { DashboardHeader } from "@/components/creator-studio/dashboard/DashboardHeader";
import { StatsCards } from "@/components/creator-studio/dashboard/StatsCards";
import { ContentPerformanceCard } from "@/components/creator-studio/dashboard/ContentPerformanceCard";
import { MembershipTiersCard } from "@/components/creator-studio/dashboard/MembershipTiersCard";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function CreatorStudioDashboard() {
  const { creatorProfile, posts, stats, tierPerformance, isLoading } = useCreatorDashboard();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  // Calculate monthly stats for StatsCards
  const monthlyStats = {
    totalActiveSubscribers: stats.subscribers.total,
    subscriberGrowthPercentage: stats.subscribers.percentage,
    subscriberChange: stats.subscribers.change,
    currentRevenue: stats.revenue.total,
    revenueGrowthPercentage: stats.revenue.percentage,
    revenueChange: stats.revenue.change,
  };

  return (
    <div className="space-y-6">
      <DashboardHeader />
      
      <StatsCards monthlyStats={monthlyStats} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ContentPerformanceCard />
        <MembershipTiersCard tiersWithCounts={tierPerformance} />
      </div>
    </div>
  );
}
