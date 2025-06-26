
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useBlockedUsers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Check if a user is blocked
  const isUserBlocked = (userId: string) => {
    return blockedUsers.has(userId);
  };

  // Block a user by updating all messages between them
  const blockUser = async (userId: string) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Update all messages between the current user and the target user to mark them as blocked
      const { error } = await supabase
        .from('messages')
        .update({ blocked_at: new Date().toISOString() })
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`);

      if (error) throw error;

      setBlockedUsers(prev => new Set([...prev, userId]));
      
      toast({
        title: "User blocked",
        description: "You will no longer see messages from this user.",
      });
    } catch (error) {
      console.error('Error blocking user:', error);
      toast({
        title: "Error",
        description: "Failed to block user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Unblock a user by removing the blocked_at timestamp
  const unblockUser = async (userId: string) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Update all messages between the current user and the target user to unblock them
      const { error } = await supabase
        .from('messages')
        .update({ blocked_at: null })
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`);

      if (error) throw error;

      setBlockedUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      
      toast({
        title: "User unblocked",
        description: "You can now send and receive messages from this user.",
      });
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast({
        title: "Error",
        description: "Failed to unblock user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load blocked users on mount
  useEffect(() => {
    if (!user) return;

    const loadBlockedUsers = async () => {
      try {
        // Get all messages that are blocked for this user
        const { data, error } = await supabase
          .from('messages')
          .select('sender_id, receiver_id')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .not('blocked_at', 'is', null);

        if (error) throw error;

        // Extract unique user IDs that are blocked
        const blocked = new Set<string>();
        data?.forEach(message => {
          const otherUserId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
          blocked.add(otherUserId);
        });

        setBlockedUsers(blocked);
      } catch (error) {
        console.error('Error loading blocked users:', error);
      }
    };

    loadBlockedUsers();
  }, [user]);

  return {
    blockedUsers,
    isUserBlocked,
    blockUser,
    unblockUser,
    isLoading
  };
}
