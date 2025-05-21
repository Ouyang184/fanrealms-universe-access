
import React from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, Download } from "lucide-react";

export const SubscriberActions: React.FC = () => {
  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" className="flex items-center gap-2">
        <Download className="h-4 w-4" />
        Export
      </Button>
      <Button className="flex items-center gap-2">
        <UserPlus className="h-4 w-4" />
        Invite Subscribers
      </Button>
    </div>
  );
};
