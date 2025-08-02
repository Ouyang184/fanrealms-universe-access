
import { useMemo } from "react";
import { SubscriberWithDetails } from "@/types/creator-studio";

export function useDashboardStats(subscribers: SubscriberWithDetails[] | undefined) {
  return useMemo(() => {
    if (!subscribers || subscribers.length === 0) {
      return {
        currentMonthSubscribers: 0,
        previousMonthSubscribers: 0,
        subscriberChange: 0,
        subscriberGrowthPercentage: 0,
        currentRevenue: 0,
        previousRevenue: 0,
        revenueChange: 0,
        revenueGrowthPercentage: 0,
        totalActiveSubscribers: 0
      };
    }

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Count all currently active subscribers
    const totalActiveSubscribers = subscribers.filter(sub => sub.status === 'active');
    
    // Count subscribers who were created before this month (existing from previous period)
    const existingSubscribers = subscribers.filter(sub => {
      const createdAt = new Date(sub.created_at);
      return createdAt < currentMonthStart && sub.status === 'active';
    });

    // Count new subscribers this month (created in current month and still active)
    const newSubscribersThisMonth = subscribers.filter(sub => 
      sub.status === 'active' && new Date(sub.created_at) >= currentMonthStart
    );

    // For a more accurate comparison, we need to estimate what the subscriber count
    // would have been at the end of last month. Since we don't have historical data,
    // we'll use the existing subscribers (who were created before this month)
    // as a baseline for the previous month count.
    const previousMonthSubscriberCount = existingSubscribers.length;

    // Calculate revenues based on current active subscribers vs existing ones
    const currentRevenue = totalActiveSubscribers.reduce((total, sub) => total + (sub.amount || 0), 0);
    const previousRevenue = existingSubscribers.reduce((total, sub) => total + (sub.amount || 0), 0);

    // Calculate changes - positive if we gained subscribers this month, negative if we lost
    const subscriberChange = newSubscribersThisMonth.length;
    const revenueChange = currentRevenue - previousRevenue;

    // Calculate percentages
    const subscriberGrowthPercentage = previousMonthSubscriberCount > 0 
      ? Math.round((subscriberChange / previousMonthSubscriberCount) * 100)
      : newSubscribersThisMonth.length > 0 ? 100 : 0;

    const revenueGrowthPercentage = previousRevenue > 0 
      ? Math.round((revenueChange / previousRevenue) * 100)
      : revenueChange > 0 ? 100 : 0;

    return {
      currentMonthSubscribers: totalActiveSubscribers.length,
      previousMonthSubscribers: previousMonthSubscriberCount,
      subscriberChange,
      subscriberGrowthPercentage,
      currentRevenue,
      previousRevenue,
      revenueChange,
      revenueGrowthPercentage,
      totalActiveSubscribers: totalActiveSubscribers.length
    };
  }, [subscribers]);
}
