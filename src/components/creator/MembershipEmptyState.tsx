
import React from "react";

export function MembershipEmptyState() {
  return (
    <div className="bg-muted/50 rounded-lg p-8">
      <p className="text-muted-foreground">This creator has not set up any membership tiers yet.</p>
      <p className="text-sm text-muted-foreground mt-2">Check back later for exclusive content opportunities!</p>
    </div>
  );
}
