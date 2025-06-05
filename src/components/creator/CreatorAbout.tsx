
import React from "react";
import { CreatorProfile } from "@/types";

interface CreatorAboutProps {
  creator: CreatorProfile;
}

export function CreatorAbout({ creator }: CreatorAboutProps) {
  const displayName = creator.displayName || creator.display_name || creator.fullName || creator.username || "Creator";
  
  return (
    <div className="max-w-3xl mx-auto prose prose-sm">
      <h3 className="text-xl font-semibold mb-4">About {displayName}</h3>
      <p className="text-muted-foreground">{creator.bio || "No information provided."}</p>
    </div>
  );
}
