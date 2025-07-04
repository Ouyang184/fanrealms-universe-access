
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { CreatorSettings } from "@/types/creator-studio";
import { useState } from "react";

interface NSFWToggleSectionProps {
  settings: CreatorSettings;
  onSettingsChange: (name: string, value: boolean) => void;
  onSave?: () => Promise<void>;
  isSaving?: boolean;
  hasChanges?: boolean;
}

export function NSFWToggleSection({ 
  settings, 
  onSettingsChange, 
  onSave, 
  isSaving = false, 
  hasChanges = false 
}: NSFWToggleSectionProps) {
  const [localNSFW, setLocalNSFW] = useState(settings.is_nsfw || false);

  const handleToggle = (checked: boolean) => {
    setLocalNSFW(checked);
    onSettingsChange('is_nsfw', checked);
  };

  const handleSave = async () => {
    if (onSave) {
      await onSave();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <CardTitle>Content Rating</CardTitle>
        </div>
        <CardDescription>
          Mark your content as 18+ if it contains mature themes, adult content, or material not suitable for minors.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="nsfw-toggle" className="text-base font-medium">
              18+ Content Creator
            </Label>
            <p className="text-sm text-muted-foreground">
              Enable this if your content is intended for adult audiences only
            </p>
          </div>
          <Switch
            id="nsfw-toggle"
            checked={localNSFW}
            onCheckedChange={handleToggle}
            disabled={isSaving}
          />
        </div>
        
        {localNSFW && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">18+ Content Enabled</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Your profile will display an "18+" badge</li>
                  <li>Content cards will show NSFW warnings</li>
                  <li>Users will see age verification prompts</li>
                  <li>Your content may be filtered for underage users</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {hasChanges && onSave && (
          <div className="flex justify-end pt-4 border-t">
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              size="sm"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
