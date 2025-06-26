
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface MonthlyStats {
  totalActiveSubscribers: number;
  subscriberGrowthPercentage: number;
  subscriberChange: number;
  currentRevenue: number;
  revenueGrowthPercentage: number;
  revenueChange: number;
}

interface StatsCardsProps {
  monthlyStats: MonthlyStats;
}

export function StatsCards({ monthlyStats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="bg-card border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
            <Badge
              variant="outline"
              className={`${
                monthlyStats.subscriberGrowthPercentage >= 0 
                  ? "bg-green-500/10 text-green-500 border-green-500/20" 
                  : "bg-red-500/10 text-red-500 border-red-500/20"
              } flex items-center gap-1`}
            >
              {monthlyStats.subscriberGrowthPercentage >= 0 ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {Math.abs(monthlyStats.subscriberGrowthPercentage)}%
            </Badge>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Subscribers</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{monthlyStats.totalActiveSubscribers.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground">
                {monthlyStats.subscriberChange >= 0 ? '+' : ''}{monthlyStats.subscriberChange} this month
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
            <Badge
              variant="outline"
              className={`${
                monthlyStats.revenueGrowthPercentage >= 0 
                  ? "bg-green-500/10 text-green-500 border-green-500/20" 
                  : "bg-red-500/10 text-red-500 border-red-500/20"
              } flex items-center gap-1`}
            >
              {monthlyStats.revenueGrowthPercentage >= 0 ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {Math.abs(monthlyStats.revenueGrowthPercentage)}%
            </Badge>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Monthly Revenue</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">${monthlyStats.currentRevenue.toFixed(2)}</span>
              <span className="text-sm text-muted-foreground">
                {monthlyStats.revenueChange >= 0 ? '+' : ''}${Math.abs(monthlyStats.revenueChange).toFixed(2)} this month
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
