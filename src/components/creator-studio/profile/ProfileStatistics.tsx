
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProfileStatisticsProps {
  postCount: number;
  tierCount: number;
}

export function ProfileStatistics({ postCount, tierCount }: ProfileStatisticsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Statistics</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg text-center">
          <p className="text-2xl font-bold">--</p>
          <p className="text-muted-foreground">Followers</p>
        </div>
        <div className="p-4 border rounded-lg text-center">
          <p className="text-2xl font-bold">{postCount}</p>
          <p className="text-muted-foreground">Posts</p>
        </div>
        <div className="p-4 border rounded-lg text-center">
          <p className="text-2xl font-bold">{tierCount}</p>
          <p className="text-muted-foreground">Membership Tiers</p>
        </div>
      </CardContent>
    </Card>
  );
}
