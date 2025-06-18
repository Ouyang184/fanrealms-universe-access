
import { Video } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface VideoUrlInputProps {
  videoUrl: string;
  setVideoUrl: (url: string) => void;
  disabled: boolean;
}

export function VideoUrlInput({ videoUrl, setVideoUrl, disabled }: VideoUrlInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="videoUrl" className="flex items-center gap-2">
        <Video className="h-4 w-4" />
        Video URL (Optional)
      </Label>
      <Input
        id="videoUrl"
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
        placeholder="Paste YouTube, Vimeo, or other video URL..."
        disabled={disabled}
      />
      <p className="text-sm text-muted-foreground">
        Supported platforms: YouTube, Vimeo, Dailymotion, Twitch
      </p>
    </div>
  );
}
