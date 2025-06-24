
import React from "react";
import { Card } from "@/components/ui/card";
import { UserCheck, DollarSign, TrendingUp } from "lucide-react";
import { SubscriberWithDetails } from "@/types/creator-studio";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

interface SubscriberStatsCardsProps {
  subscribers: SubscriberWithDetails[];
  tiers: Array<{id: string; name: string; price: number}>;
  tierCounts: Record<string, number>;
  isLoading?: boolean;
}

export const SubscriberStatsCards: React.FC<SubscriberStatsCardsProps> = ({ 
  subscribers, 
  tiers, 
  tierCounts,
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Calculate active subscribers (only those with active or cancelling status)
  const activeSubscribers = subscribers.filter(sub => 
    sub.status === 'active' || sub.status === 'cancelling'
  );

  // Calculate actual monthly revenue from Stripe subscription amounts
  const monthlyRevenue = activeSubscribers.reduce((total, sub) => {
    return total + (sub.amount || 0);
  }, 0);

  // Calculate average revenue per subscriber
  const averageRevenue = activeSubscribers.length > 0 ? monthlyRevenue / activeSubscribers.length : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Active Subscribers Card */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <UserCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Active Subscribers</p>
            <h3 className="text-2xl font-bold">{activeSubscribers.length}</h3>
            <p className="text-xs text-muted-foreground">
              {subscribers.length - activeSubscribers.length > 0 && 
                `${subscribers.length - activeSubscribers.length} inactive`
              }
            </p>
          </div>
        </div>
      </Card>
      
      {/* Monthly Recurring Revenue Card - Links to Payouts Page */}
      <Link to="/creator-studio/payouts">
        <Card className="p-6 hover:border-primary/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Revenue (MRR)</p>
              <h3 className="text-2xl font-bold">${monthlyRevenue.toFixed(2)}</h3>
              <p className="text-xs text-muted-foreground">From active subscriptions</p>
            </div>
          </div>
        </Card>
      </Link>
      
      {/* Average Revenue Per User */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Average Revenue</p>
            <h3 className="text-2xl font-bold">${averageRevenue.toFixed(2)}</h3>
            <p className="text-xs text-muted-foreground">Per subscriber/month</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
