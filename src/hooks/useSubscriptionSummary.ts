
import { useMemo } from 'react';

interface SubscriptionData {
  tier?: { price: number } | null;
  membership_tiers?: { price: number } | null;
  amount?: number | null;
  amount_paid?: number | null;
  current_period_end?: string | null;
  created_at: string;
}

export const useSubscriptionSummary = (subscriptions: SubscriptionData[] | undefined) => {
  return useMemo(() => {
    if (!subscriptions || subscriptions.length === 0) {
      return {
        monthlySpending: 0,
        nextPayment: {
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          amount: 0
        }
      };
    }

    // Calculate monthly spending - check multiple possible amount sources
    const monthlySpending = subscriptions.reduce((total, sub) => {
      const amount = sub.amount || sub.membership_tiers?.price || sub.tier?.price || sub.amount_paid || 0;
      return total + amount;
    }, 0);

    // Find next payment date from actual subscription data
    const nextActiveSubscription = subscriptions.find(s => s.current_period_end);
    let nextPaymentDate;
    let nextPaymentAmount = 0;
    
    if (nextActiveSubscription?.current_period_end) {
      nextPaymentDate = new Date(nextActiveSubscription.current_period_end);
      nextPaymentAmount = nextActiveSubscription.amount || 
                         nextActiveSubscription.membership_tiers?.price || 
                         nextActiveSubscription.tier?.price || 
                         nextActiveSubscription.amount_paid || 0;
    } else {
      // Fallback if no subscription data available
      nextPaymentDate = new Date();
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    }
    
    const nextPayment = {
      date: nextPaymentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      amount: nextPaymentAmount
    };

    return {
      monthlySpending,
      nextPayment
    };
  }, [subscriptions]);
};
