
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Tier {
  id: string;
  name: string;
  price: number;
  features: string[];
  subscriberCount?: number;
}

interface ProfileMembershipTabProps {
  tiers: Tier[];
  isLoading: boolean;
}

export function ProfileMembershipTab({ tiers, isLoading }: ProfileMembershipTabProps) {
  return (
    <div className="text-center p-8">
      <h3 className="text-xl font-semibold mb-2">Your Membership Tiers</h3>
      <p className="text-muted-foreground mb-6">These are the tiers available to your subscribers.</p>
      
      {isLoading ? (
        <div className="flex justify-center">
          <LoadingSpinner />
        </div>
      ) : tiers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {tiers.map(tier => (
            <div key={tier.id} className="border rounded-lg p-4">
              <h4 className="font-medium">{tier.name}</h4>
              <p className="text-xl font-bold mt-1">${Number(tier.price).toFixed(2)}/mo</p>
              <Badge className="mt-2">{tier.subscriberCount || 0} subscribers</Badge>
              <ul className="mt-3">
                {tier.features.map((feature, i) => (
                  <li key={i} className="text-sm text-muted-foreground">{feature}</li>
                ))}
              </ul>
              <Button asChild variant="outline" className="w-full mt-4">
                <Link to="/creator-studio/membership-tiers">Manage</Link>
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <p className="mb-4">You haven't created any membership tiers yet.</p>
          <Button asChild>
            <Link to="/creator-studio/membership-tiers">Create Your First Tier</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
