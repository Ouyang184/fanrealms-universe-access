
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BannerUpload } from "@/components/creator-studio/BannerUpload";

interface BannerSectionProps {
  userId: string;
  currentBannerUrl: string | null;
  onBannerUpdate: (bannerUrl: string) => void;  // Changed from Promise<void> to void
}

export function BannerSection({ userId, currentBannerUrl, onBannerUpdate }: BannerSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Banner</CardTitle>
        <CardDescription>
          Upload a banner image for your creator page
        </CardDescription>
      </CardHeader>
      <CardContent>
        <BannerUpload
          userId={userId}
          currentBannerUrl={currentBannerUrl}
          onBannerUpdate={onBannerUpdate}
        />
      </CardContent>
    </Card>
  );
}
