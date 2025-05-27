
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface BillingHistoryProps {
  subscriptions: any[] | undefined;
}

export function BillingHistory({ subscriptions }: BillingHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Payments</CardTitle>
        <CardDescription>Your scheduled subscription renewals</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {subscriptions?.map((subscription) => {
            const creator = subscription.creator;
            const tier = subscription.tier;
            const user = creator?.users;
            
            // Calculate next billing date based on current period end
            const nextBillingDate = subscription.current_period_end ? 
              new Date(subscription.current_period_end) : 
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            
            const nextBilling = nextBillingDate.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            });
            
            return (
              <div
                key={subscription.id}
                className="flex items-center justify-between p-4 border rounded-md"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={creator?.profile_image_url || user?.profile_picture || "/lovable-uploads/a88120a6-4c72-4539-b575-22350a7045c1.png"}
                      alt={user?.username || "Creator"}
                    />
                    <AvatarFallback>
                      {(creator?.display_name || user?.username || "C").charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {creator?.display_name || user?.username || "Creator"}
                    </div>
                    <div className="text-sm text-muted-foreground">{tier?.title || "Free"}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">${(tier?.price || subscription.amount_paid || 0).toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">{nextBilling}</div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
