
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SocialLinks } from "@/components/SocialLinks";
import { CreatorProfile } from "@/types";

interface ProfileHeaderProps {
  creator: CreatorProfile & { displayName: string };
}

export function ProfileHeader({ creator }: ProfileHeaderProps) {
  const displayName = creator.displayName || creator.username || "Creator";
  const avatarUrl = creator.avatar_url || creator.profile_image_url;
  const bannerImage = creator.banner_url || "/default-banner.jpg";

  return (
    <div className="relative">
      <div className="h-48 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-lg overflow-hidden">
        {creator.banner_url && (
          <img 
            src={bannerImage} 
            alt="Creator Banner" 
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div className="flex flex-col md:flex-row items-center md:items-end p-4 -mt-16 md:-mt-12">
        <Avatar className="h-32 w-32 border-4 border-background">
          <AvatarImage src={avatarUrl || undefined} alt={displayName} />
          <AvatarFallback className="text-4xl">
            {(displayName || "C").charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="mt-4 md:mt-0 md:ml-6 text-center md:text-left flex-1">
          <h1 className="text-3xl font-bold">{displayName}</h1>
          <p className="text-muted-foreground">@{creator.username}</p>
          
          {creator.id && (
            <div className="mt-2">
              <SocialLinks creatorId={creator.id} />
            </div>
          )}
        </div>
        <div className="mt-4 md:mt-0">
          <Button asChild>
            <Link to="/creator-studio/settings">Edit Profile</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
