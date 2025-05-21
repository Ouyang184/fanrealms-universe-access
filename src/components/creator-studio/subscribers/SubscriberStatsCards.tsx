
import React from "react";
import { Card } from "@/components/ui/card";
import { UserCheck } from "lucide-react";
import { SubscriberWithDetails } from "@/types/creator-studio";

interface SubscriberStatsCardsProps {
  subscribers: SubscriberWithDetails[];
  tiers: Array<{id: string; name: string; price: number}>;
  tierCounts: Record<string, number>;
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

export const SubscriberStatsCards: React.FC<SubscriberStatsCardsProps> = ({ subscribers, tiers, tierCounts }) => {
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
      
      {/* Dynamic Tier Cards - Show top 2 tiers or fewer if not enough tiers */}
      {tiers && tiers.length > 0 ? (
        // If we have actual tiers from the database
        tiers.slice(0, 2).map((tier, index) => (
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
        // Fallback to show the most populated tiers from sample data
        Object.entries(tierCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2)
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
