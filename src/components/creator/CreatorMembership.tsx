
import React from "react";
import { Button } from "@/components/ui/button";
import { CreatorProfile } from "@/types";

interface CreatorMembershipProps {
  creator: CreatorProfile;
}

export function CreatorMembership({ creator }: CreatorMembershipProps) {
  return (
    <div className="text-center p-8">
      <h3 className="text-xl font-semibold mb-2">Membership Tiers</h3>
      <p className="text-muted-foreground">Join this creator's community to unlock exclusive content and perks.</p>
      {creator.tiers && creator.tiers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {creator.tiers.map(tier => (
            <div key={tier.id} className="border rounded-lg p-4">
              <h4 className="font-medium">{tier.name}</h4>
              <p className="text-xl font-bold mt-1">${Number(tier.price).toFixed(2)}/mo</p>
              <ul className="mt-3">
                {tier.features.map((feature, i) => (
                  <li key={i} className="text-sm text-muted-foreground">{feature}</li>
                ))}
              </ul>
              <Button className="w-full mt-4">Subscribe</Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4">This creator has not set up any membership tiers yet.</p>
      )}
    </div>
  );
}
