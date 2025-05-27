
import { Card, CardContent } from "@/components/ui/card";
import { useSubscriptionSummary } from "@/hooks/useSubscriptionSummary";

interface SubscriptionSummaryProps {
  subscriptions: any[] | undefined;
}

export function SubscriptionSummary({ subscriptions }: SubscriptionSummaryProps) {
  const { monthlySpending, nextPayment } = useSubscriptionSummary(subscriptions);

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm">Active Subscriptions</span>
            <div className="flex items-baseline mt-1">
              <span className="text-3xl font-semibold">{subscriptions?.length || 0}</span>
              <span className="text-green-500 text-sm ml-2">Active</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm">Monthly Spending</span>
            <div className="flex items-baseline mt-1">
              <span className="text-3xl font-semibold">
                ${monthlySpending.toFixed(2)}
              </span>
              <span className="text-muted-foreground text-sm ml-2">per month</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm">Next Payment</span>
            <div className="flex items-baseline mt-1">
              <span className="text-3xl font-semibold">{nextPayment.date}</span>
              <span className="text-muted-foreground text-sm ml-2">
                ${nextPayment.amount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
