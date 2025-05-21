
import React from "react";
import { SubscriberActions } from "./SubscriberActions";

export const SubscriberHeader: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
      <div>
        <h1 className="text-3xl font-bold">Subscribers</h1>
        <p className="text-muted-foreground">Manage and view insights about your subscribers</p>
      </div>
      <SubscriberActions />
    </div>
  );
};
