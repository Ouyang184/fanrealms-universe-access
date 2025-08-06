
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { Spinner } from "@/components/ui/spinner";

export function NotificationsTab() {
  const { 
    preferences, 
    isLoading, 
    isSaving, 
    updatePreference, 
    savePreferences 
  } = useNotificationPreferences();

  const handleNotificationChange = (key: keyof typeof preferences, value: boolean) => {
    updatePreference(key, value);
  };

  const handleSavePreferences = async () => {
    await savePreferences(preferences);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Control how and when you receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Email Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive content update from creators via email
            </p>
            <p className="text-xs text-muted-foreground italic">
              Email notifications are only for New Content Alerts and Creator Updates
            </p>
          </div>
          <Switch 
            checked={preferences.emailNotifications}
            onCheckedChange={(checked) => handleNotificationChange("emailNotifications", checked)}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>New Content Alerts</Label>
            <p className="text-sm text-muted-foreground">
              Get notified when creators you follow post new content
            </p>
          </div>
          <Switch 
            checked={preferences.newContentAlerts}
            onCheckedChange={(checked) => handleNotificationChange("newContentAlerts", checked)}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Comment Replies</Label>
            <p className="text-sm text-muted-foreground">
              Get notified when someone replies to your comments
            </p>
          </div>
          <Switch 
            checked={preferences.commentReplies}
            onCheckedChange={(checked) => handleNotificationChange("commentReplies", checked)}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Mentions</Label>
            <p className="text-sm text-muted-foreground">
              Get notified when you're mentioned in a post or comment
            </p>
          </div>
          <Switch 
            checked={preferences.mentions}
            onCheckedChange={(checked) => handleNotificationChange("mentions", checked)}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Creator Updates</Label>
            <p className="text-sm text-muted-foreground">
              Get notified about important updates from creators you follow
            </p>
          </div>
          <Switch 
            checked={preferences.creatorUpdates}
            onCheckedChange={(checked) => handleNotificationChange("creatorUpdates", checked)}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSavePreferences} 
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Preferences"}
        </Button>
      </CardFooter>
    </Card>
  );
}
