
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useNotificationActions } from "./useNotificationActions";

export function useFollow() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { createFollowNotification } = useNotificationActions();
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [optimisticFollowerCount, setOptimisticFollowerCount] = useState<number | null>(null);

  // Function to check if user is following a creator using follows table
  const checkFollowStatus = async (creatorId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase
        .from("follows")
        .select("user_id, creator_id")
        .eq("user_id", user.id)
        .eq("creator_id", creatorId)
        .maybeSingle();
      
      if (error && error.code !== "PGRST116") {
        console.error("Error checking follow status:", error);
        return false;
      }
      
      return !!data;
    } catch (error) {
      console.error("Error checking follow status:", error);
      return false;
    }
  };

  // Function to follow a creator using follows table with optimistic updates
  const followCreator = async (creatorId: string): Promise<void> => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to follow a creator",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Following creator:", creatorId, "User:", user.id);
    
    if (isLoading) return;
    setIsLoading(true);
    
    // Get current creator data for optimistic update
    let currentFollowerCount = 0;
    try {
      const { data: creator, error } = await supabase
        .from("creators")
        .select("user_id, display_name, users(username), follower_count")
        .eq("id", creatorId)
        .single();
      
      if (error) {
        console.error("Error fetching creator:", error);
        setIsLoading(false);
        toast({
          title: "Error",
          description: "Failed to follow creator",
          variant: "destructive",
        });
        return;
      }
      
      console.log("Creator data:", creator);
      
      if (creator?.user_id === user.id) {
        setIsLoading(false);
        toast({
          title: "Cannot Follow Yourself",
          description: "You cannot follow your own creator profile",
          variant: "destructive",
        });
        return;
      }

      currentFollowerCount = creator.follower_count || 0;
      
      // Optimistic update - immediately update UI
      const newCount = currentFollowerCount + 1;
      console.log("Applying optimistic update - setting follow to true, count from", currentFollowerCount, "to", newCount);
      setIsFollowing(true);
      setOptimisticFollowerCount(newCount);
      
      // Update cache optimistically
      queryClient.setQueryData(['creatorProfile', creatorId], (oldData: any) => {
        if (oldData) {
          return {
            ...oldData,
            follower_count: newCount
          };
        }
        return oldData;
      });
      
    } catch (error) {
      console.error("Error checking creator ownership:", error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Failed to follow creator",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Insert the follow relationship with explicit user_id for RLS
      const { data: insertData, error: followError } = await supabase
        .from("follows")
        .insert([{
          user_id: user.id,
          creator_id: creatorId
        }])
        .select('creator_id')
        .single();
      
      if (followError) {
        if (followError.code === "23505") { // Unique constraint violation
          toast({
            description: "You're already following this creator",
          });
          // Keep optimistic state as user is already following
          setIsFollowing(true);
        } else {
          console.error("Follow error:", followError);
          // Revert optimistic update on error
          setIsFollowing(false);
          setOptimisticFollowerCount(null);
          queryClient.setQueryData(['creatorProfile', creatorId], (oldData: any) => {
            if (oldData) {
              return {
                ...oldData,
                follower_count: currentFollowerCount
              };
            }
            return oldData;
          });
          throw followError;
        }
      } else {
        console.log("Follow successful");
        toast({
          description: "You are now following this creator",
        });
        
        // Get the creator's user_id for the notification
        const { data: creatorData } = await supabase
          .from("creators")
          .select("user_id")
          .eq("id", creatorId)
          .single();
          
        if (creatorData?.user_id) {
          try {
            await createFollowNotification(creatorId, creatorData.user_id);
            console.log("Follow notification created successfully");
          } catch (notificationError) {
            console.error("Failed to create follow notification:", notificationError);
            // Don't fail the follow action if notification creation fails
          }
        }
        
        // Clear optimistic state after a longer delay to prevent flicker
        setTimeout(() => {
          setOptimisticFollowerCount(null);
          // Invalidate queries to sync with server
          queryClient.invalidateQueries({ queryKey: ["creatorProfile"] });
          queryClient.invalidateQueries({ queryKey: ["creatorProfileDetails"] });
          queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
          queryClient.invalidateQueries({ queryKey: ["creators"] });
          queryClient.invalidateQueries({ queryKey: ["followedCreators"] });
          queryClient.invalidateQueries({ queryKey: ["follows"] });
          queryClient.invalidateQueries({ queryKey: ["posts"] });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }, 2000);
      }
    } catch (error: any) {
      console.error("Error following creator:", error);
      // Revert optimistic update on error
      setIsFollowing(false);
      setOptimisticFollowerCount(null);
      queryClient.setQueryData(['creatorProfile', creatorId], (oldData: any) => {
        if (oldData) {
          return {
            ...oldData,
            follower_count: currentFollowerCount
          };
        }
        return oldData;
      });
      toast({
        title: "Error",
        description: error.message || "Failed to follow creator",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to unfollow a creator using follows table with optimistic updates
  const unfollowCreator = async (creatorId: string): Promise<void> => {
    if (!user) return;
    
    if (isLoading) return;
    setIsLoading(true);
    
    // Get current follower count for optimistic update
    let currentFollowerCount = 0;
    try {
      const { data: creator } = await supabase
        .from("creators")
        .select("follower_count")
        .eq("id", creatorId)
        .single();
      
      currentFollowerCount = creator?.follower_count || 0;
      
      // Optimistic update - immediately update UI
      const newCount = Math.max(currentFollowerCount - 1, 0);
      console.log("Applying optimistic update - setting follow to false, count from", currentFollowerCount, "to", newCount);
      setIsFollowing(false);
      setOptimisticFollowerCount(newCount);
      
      // Update cache optimistically and prevent it from being overwritten
      queryClient.setQueryData(['creatorProfile', creatorId], (oldData: any) => {
        if (oldData) {
          return {
            ...oldData,
            follower_count: newCount
          };
        }
        return oldData;
      });
      
    } catch (error) {
      console.error("Error getting creator data for optimistic update:", error);
    }
    
    try {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("user_id", user.id)
        .eq("creator_id", creatorId);
      
      if (error) {
        console.error("Unfollow error:", error);
        // Revert optimistic update on error
        setIsFollowing(true);
        setOptimisticFollowerCount(null);
        queryClient.setQueryData(['creatorProfile', creatorId], (oldData: any) => {
          if (oldData) {
            return {
              ...oldData,
              follower_count: currentFollowerCount
            };
          }
          return oldData;
        });
        throw error;
      }
      
      console.log("Unfollow successful");
      toast({
        description: "You have unfollowed this creator",
      });
      
      // Clear optimistic state after a longer delay and ensure cache is updated properly
      setTimeout(() => {
        // Force a fresh fetch to get the actual count from the server
        queryClient.invalidateQueries({ queryKey: ["creatorProfile", creatorId] });
        queryClient.invalidateQueries({ queryKey: ["creatorProfileDetails"] });
        queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
        queryClient.invalidateQueries({ queryKey: ["creators"] });
        queryClient.invalidateQueries({ queryKey: ["followedCreators"] });
        queryClient.invalidateQueries({ queryKey: ["follows"] });
        queryClient.invalidateQueries({ queryKey: ["posts"] });
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        
        // Clear optimistic state only after cache is refreshed
        setTimeout(() => {
          setOptimisticFollowerCount(null);
        }, 500);
      }, 1500);
    } catch (error: any) {
      // Revert optimistic update on error
      setIsFollowing(true);
      setOptimisticFollowerCount(null);
      queryClient.setQueryData(['creatorProfile', creatorId], (oldData: any) => {
        if (oldData) {
          return {
            ...oldData,
            follower_count: currentFollowerCount
          };
        }
        return oldData;
      });
      toast({
        title: "Error",
        description: error.message || "Failed to unfollow creator",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isFollowing,
    isLoading,
    optimisticFollowerCount,
    setIsFollowing,
    setOptimisticFollowerCount,
    checkFollowStatus,
    followCreator,
    unfollowCreator,
  };
}
