
import React from "react";
import { useAgeVerification } from "@/hooks/useAgeVerification";
import { NSFWContentPlaceholder } from "./NSFWContentPlaceholder";
import { useNSFWPreferences } from "@/hooks/useNSFWPreferences";
import { useAuth } from "@/contexts/AuthContext";

interface NSFWContentGateProps {
  isNSFW: boolean;
  authorId?: string;
  children: React.ReactNode;
  type?: "post" | "creator" | "general";
  className?: string;
}

export function NSFWContentGate({ 
  isNSFW, 
  authorId, 
  children, 
  type = "general",
  className 
}: NSFWContentGateProps) {
  const { user } = useAuth();
  const { data: nsfwPrefs } = useNSFWPreferences();
  const { isAgeVerified, isLoading: isAgeVerificationLoading } = useAgeVerification();

  // Don't gate content for the author viewing their own content
  const isOwnContent = user?.id === authorId;
  
  // If content is not NSFW, show it directly
  if (!isNSFW) {
    return <>{children}</>;
  }

  // If user is viewing their own NSFW content, allow access
  if (isOwnContent) {
    return <>{children}</>;
  }

  // If NSFW is disabled in user preferences, show placeholder
  if (!nsfwPrefs?.isNSFWEnabled) {
    return (
      <div className={className}>
        <NSFWContentPlaceholder type={type} showSettingsLink={true} />
      </div>
    );
  }

  // If we're still loading age verification status, show loading state
  if (isAgeVerificationLoading) {
    return <>{children}</>;
  }

  // If user has NSFW enabled but hasn't verified age, show placeholder directing to settings
  if (nsfwPrefs?.isNSFWEnabled && !isAgeVerified) {
    return (
      <div className={className}>
        <NSFWContentPlaceholder 
          type={type} 
          showSettingsLink={true}
          message="Please complete age verification in your settings to view this content."
        />
      </div>
    );
  }

  // If user is age verified and NSFW is enabled, show content
  return <>{children}</>;
}
