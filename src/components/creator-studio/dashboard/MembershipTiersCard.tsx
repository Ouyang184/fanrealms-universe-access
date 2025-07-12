
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, Plus } from "lucide-react";
import { Link } from "react-router-dom";

interface TierWithCounts {
  id: string;
  name: string;
  price: number;
  subscribers: number;
  percentage: number;
  revenue: number;
}

interface MembershipTiersCardProps {
  tiersWithCounts: TierWithCounts[];
}

export function MembershipTiersCard({ tiersWithCounts }: MembershipTiersCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Membership Tiers</CardTitle>
          <Button variant="link" asChild className="text-primary p-0">
            <Link to="/creator-studio/membership-tiers">
              Manage Tiers <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
        <CardDescription>Performance of your membership tiers</CardDescription>
      </CardHeader>
      <CardContent>
        {tiersWithCounts.length > 0 ? (
          <div className="space-y-4">
            {tiersWithCounts.map((tier) => (
              <div key={tier.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        tier.price <= 5
                          ? "bg-blue-500"
                          : tier.price <= 15
                            ? "bg-primary"
                            : "bg-green-500"
                      }
                    >
                      {tier.name}
                    </Badge>
                    <span className="text-sm text-muted-foreground">${tier.price.toFixed(2)}/month</span>
                  </div>
                  <div className="text-sm font-medium">{tier.subscribers} subscribers</div>
                </div>
                <Progress value={tier.percentage} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{tier.percentage}% of subscribers</span>
                  <span>${tier.revenue.toFixed(2)} monthly revenue</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-muted-foreground mb-4">You haven't created any membership tiers yet.</p>
            <Button asChild>
              <Link to="/creator-studio/membership-tiers">Create Your First Tier</Link>
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button variant="outline" asChild className="w-full">
          <Link to="/creator-studio/membership-tiers">
            <Plus className="h-4 w-4 mr-2" />
            Create New Tier
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
