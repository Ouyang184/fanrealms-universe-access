
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function NotificationsTab() {
  const { toast } = useToast();
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    newContentAlerts: true,
    commentReplies: true,
    mentions: true,
    creatorUpdates: true,
    saving: false
  });

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveNotificationSettings = async () => {
    setNotificationSettings(prev => ({ ...prev, saving: true }));
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Notification preferences updated",
        description: "Your notification settings have been saved.",
      });
    } catch (error) {
      console.error('Error saving notifications:', error);
      toast({
        title: "Error",
        description: "Failed to update notification settings.",
        variant: "destructive",
      });
    } finally {
      setNotificationSettings(prev => ({ ...prev, saving: false }));
    }
  };

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
              Receive notifications via email
            </p>
          </div>
          <Switch 
            checked={notificationSettings.emailNotifications}
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
            checked={notificationSettings.newContentAlerts}
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
            checked={notificationSettings.commentReplies}
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
            checked={notificationSettings.mentions}
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
            checked={notificationSettings.creatorUpdates}
            onCheckedChange={(checked) => handleNotificationChange("creatorUpdates", checked)}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={saveNotificationSettings} 
          disabled={notificationSettings.saving}
        >
          {notificationSettings.saving ? "Saving..." : "Save Preferences"}
        </Button>
      </CardFooter>
    </Card>
  );
}
