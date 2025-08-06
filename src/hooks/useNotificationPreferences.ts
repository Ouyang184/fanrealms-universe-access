import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export interface NotificationPreferences {
  emailNotifications: boolean;
  newContentAlerts: boolean;
  commentReplies: boolean;
  mentions: boolean;
  creatorUpdates: boolean;
}

export const useNotificationPreferences = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    newContentAlerts: true,
    commentReplies: true,
    mentions: true,
    creatorUpdates: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load preferences from database
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('notification_preferences')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error loading notification preferences:', error);
        } else if (data?.notification_preferences) {
          const prefs = data.notification_preferences as Record<string, boolean>;
          setPreferences({
            emailNotifications: prefs.email_notifications ?? true,
            newContentAlerts: prefs.new_content_alerts ?? true,
            commentReplies: prefs.comment_replies ?? true,
            mentions: prefs.mentions ?? true,
            creatorUpdates: prefs.creator_updates ?? true,
          });
        }
      } catch (error) {
        console.error('Error loading notification preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [user?.id]);

  // Save preferences to database
  const savePreferences = async (newPreferences: NotificationPreferences) => {
    if (!user?.id) return;

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          notification_preferences: {
            email_notifications: newPreferences.emailNotifications,
            new_content_alerts: newPreferences.newContentAlerts,
            comment_replies: newPreferences.commentReplies,
            mentions: newPreferences.mentions,
            creator_updates: newPreferences.creatorUpdates,
          }
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      setPreferences(newPreferences);
      toast({
        title: "Notification preferences updated",
        description: "Your notification settings have been saved.",
      });
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast({
        title: "Error",
        description: "Failed to update notification settings.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Update individual preference
  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    return newPreferences;
  };

  return {
    preferences,
    isLoading,
    isSaving,
    updatePreference,
    savePreferences,
  };
};