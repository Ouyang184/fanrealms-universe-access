
import { useMemo } from 'react';

interface SubscriptionData {
  tier?: { price: number } | null;
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

    // Calculate monthly spending
    const monthlySpending = subscriptions.reduce((total, sub) => {
      return total + (sub.tier?.price || sub.amount_paid || 0);
    }, 0);

    // Find next payment date
    const today = new Date();
    let nextPaymentDate = new Date(today);
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    const nextPayment = {
      date: nextPaymentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      amount: subscriptions.find(s => s.tier || s.amount_paid)?.tier?.price || subscriptions[0]?.amount_paid || 0
    };

    return {
      monthlySpending,
      nextPayment
    };
  }, [subscriptions]);
};
