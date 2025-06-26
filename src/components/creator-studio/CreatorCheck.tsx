
import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useNavigate } from "react-router-dom";

interface CreatorCheckProps {
  children: ReactNode;
}

export function CreatorCheck({ children }: CreatorCheckProps) {
  const { creatorProfile, isLoading } = useCreatorProfile();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!creatorProfile) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <h2 className="text-2xl font-semibold mb-4">Become a Creator</h2>
          <p className="text-muted-foreground mb-6">
            You don't have a Creator Profile yet. Click the button below to create one and start posting!
          </p>
          <Button 
            onClick={() => navigate('/complete-profile')}
          >
            Become a Creator
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
