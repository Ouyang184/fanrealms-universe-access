
import React from "react";
import { Card } from "@/components/ui/card";
import { UserCheck, DollarSign } from "lucide-react";
import { SubscriberWithDetails } from "@/types/creator-studio";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

interface SubscriberStatsCardsProps {
  subscribers: SubscriberWithDetails[];
  tiers: Array<{id: string; name: string; price: number}>;
  tierCounts: Record<string, number>;
  isLoading?: boolean;
}

// Helper function to get tier color classes
const getTierColorClasses = (index: number) => {
  const colorClasses = [
    "bg-primary/10 text-primary",
    "bg-secondary/20 text-secondary-foreground",
    "bg-purple-500/10 text-purple-500",
    "bg-blue-500/10 text-blue-500",
    "bg-amber-500/10 text-amber-500"
  ];
  return colorClasses[index % colorClasses.length];
};

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

  // Calculate estimated monthly revenue
  const estimatedRevenue = subscribers.reduce((total, sub) => {
    return total + (sub.tierPrice || 0);
  }, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Subscribers Card */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <UserCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Subscribers</p>
            <h3 className="text-2xl font-bold">{subscribers.length}</h3>
          </div>
        </div>
      </Card>
      
      {/* Monthly Revenue Card - Links to Payouts Page */}
      <Link to="/creator-studio/payouts">
        <Card className="p-6 hover:border-primary/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Revenue</p>
              <h3 className="text-2xl font-bold">${estimatedRevenue.toFixed(2)}</h3>
            </div>
          </div>
        </Card>
      </Link>
      
      {/* Dynamic Tier Card - Show top tier or fewer if not enough tiers */}
      {tiers && tiers.length > 0 ? (
        // If we have actual tiers from the database, show the top tier
        tiers.slice(0, 1).map((tier, index) => (
          <Card key={tier.id} className="p-6">
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${getTierColorClasses(index)}`}>
                <UserCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{tier.name} Subscribers</p>
                <h3 className="text-2xl font-bold">{tierCounts[tier.name] || 0}</h3>
              </div>
            </div>
          </Card>
        ))
      ) : (
        // Fallback to show the most populated tier from sample data
        Object.entries(tierCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 1)
          .map(([tierName, count], index) => (
            <Card key={tierName} className="p-6">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${getTierColorClasses(index + 1)}`}>
                  <UserCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{tierName} Subscribers</p>
                  <h3 className="text-2xl font-bold">{count}</h3>
                </div>
              </div>
            </Card>
          ))
      )}
    </div>
  );
};
