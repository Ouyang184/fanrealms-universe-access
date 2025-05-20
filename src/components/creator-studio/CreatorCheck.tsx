
import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface CreatorCheckProps {
  children: ReactNode;
}

export function CreatorCheck({ children }: CreatorCheckProps) {
  const { creatorProfile, isLoading, createProfile, isCreating } = useCreatorProfile();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!creatorProfile) {
    const handleCreateProfile = async () => {
      try {
        createProfile();
        // Note: The actual navigation and toast will happen in the useCreatorProfile hook
      } catch (error) {
        console.error("Error creating creator profile:", error);
        toast({
          title: "Error",
          description: "Failed to create creator profile. Please try again.",
          variant: "destructive",
        });
      }
    };

    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <h2 className="text-2xl font-semibold mb-4">Become a Creator</h2>
          <p className="text-muted-foreground mb-6">
            You need a creator profile to access the Creator Studio. Would you like to create one now?
          </p>
          <div className="flex gap-4">
            <Button 
              onClick={handleCreateProfile} 
              disabled={isCreating}
            >
              {isCreating && <LoadingSpinner className="mr-2" />}
              Become a Creator
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/home')}
            >
              Not Now
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
