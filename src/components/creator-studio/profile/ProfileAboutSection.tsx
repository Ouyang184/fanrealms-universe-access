
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreatorProfile } from "@/types";

interface ProfileAboutSectionProps {
  creator: CreatorProfile & { display_name?: string; tags?: string[] };
}

export function ProfileAboutSection({ creator }: ProfileAboutSectionProps) {
  const displayName = creator.display_name || creator.username || "Creator";
  
  return (
    <div className="space-y-6">
      {/* Bio Section */}
      <Card>
        <CardHeader>
          <CardTitle>About {displayName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {creator.bio || "This creator hasn't added a bio yet. Add one in your creator settings."}
          </p>
        </CardContent>
      </Card>

      {/* Content Tags Section */}
      {creator.tags && creator.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Content Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {creator.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-sm px-3 py-1">
                  {tag}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              {creator.tags.length} content {creator.tags.length === 1 ? 'category' : 'categories'} selected
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
