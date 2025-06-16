
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

    const currentActiveSubscribers = subscribers.filter(sub => 
      sub.status === 'active' && new Date(sub.created_at) >= currentMonthStart
    );

    const previousActiveSubscribers = subscribers.filter(sub => 
      sub.status === 'active' && 
      new Date(sub.created_at) >= previousMonthStart && 
      new Date(sub.created_at) <= previousMonthEnd
    );

    const totalActiveSubscribers = subscribers.filter(sub => sub.status === 'active');

    const currentRevenue = totalActiveSubscribers.reduce((total, sub) => total + (sub.amount || 0), 0);
    const previousRevenue = previousActiveSubscribers.reduce((total, sub) => total + (sub.amount || 0), 0);

    const subscriberChange = currentActiveSubscribers.length - previousActiveSubscribers.length;
    const revenueChange = currentRevenue - previousRevenue;

    const subscriberGrowthPercentage = previousActiveSubscribers.length > 0 
      ? Math.round(((currentActiveSubscribers.length - previousActiveSubscribers.length) / previousActiveSubscribers.length) * 100)
      : currentActiveSubscribers.length > 0 ? 100 : 0;

    const revenueGrowthPercentage = previousRevenue > 0 
      ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
      : currentRevenue > 0 ? 100 : 0;

    return {
      currentMonthSubscribers: currentActiveSubscribers.length,
      previousMonthSubscribers: previousActiveSubscribers.length,
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
