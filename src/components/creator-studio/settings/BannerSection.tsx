
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { BannerUpload } from "@/components/creator-studio/BannerUpload";

interface BannerSectionProps {
  userId: string;
  currentBannerUrl: string | null;
  onBannerUpdate: (bannerUrl: string) => void;
  onSave?: () => void;
  isSaving?: boolean;
  hasChanges?: boolean;
}

export function BannerSection({ 
  userId, 
  currentBannerUrl, 
  onBannerUpdate,
  onSave,
  isSaving = false,
  hasChanges = false
}: BannerSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Banner</CardTitle>
        <CardDescription>
          Upload a banner image for your creator page
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <BannerUpload
          userId={userId}
          currentBannerUrl={currentBannerUrl}
          onBannerUpdate={onBannerUpdate}
        />

        {/* Save Button */}
        <div className="flex justify-start pt-4 border-t">
          <Button 
            onClick={onSave}
            disabled={!hasChanges || isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className={`mr-2 h-4 w-4 ${isSaving ? 'animate-spin' : ''}`} />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
