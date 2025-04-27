
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, CreditCard } from "lucide-react";
import { useState, useEffect } from "react";
import { CreatorStats } from "@/types/creator-studio";

export default function CreatorStudioDashboard() {
  const [stats, setStats] = useState<CreatorStats>({
    totalPosts: 0,
    totalSubscribers: 0,
    totalEarnings: 0
  });

  useEffect(() => {
    // Mock data for now, would be replaced with actual API calls
    setTimeout(() => {
      setStats({
        totalPosts: 12,
        totalSubscribers: 156,
        totalEarnings: 1253.50
      });
    }, 500);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Creator Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard 
          title="Total Posts" 
          value={stats.totalPosts.toString()} 
          icon={FileText} 
        />
        <StatCard 
          title="Subscribers" 
          value={stats.totalSubscribers.toString()} 
          icon={Users} 
        />
        <StatCard 
          title="Total Earnings" 
          value={`$${stats.totalEarnings.toFixed(2)}`} 
          icon={CreditCard} 
        />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="text-muted-foreground">
              <p>Coming soon - Activity feed for your creator profile</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Growth Insights</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="text-muted-foreground">
              <p>Coming soon - Subscriber growth and content engagement metrics</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
}

function StatCard({ title, value, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
