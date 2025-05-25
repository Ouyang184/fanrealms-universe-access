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

  // Function to follow a creator using follows table
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
    
    // Check if user is trying to follow themselves
    try {
      const { data: creator, error } = await supabase
        .from("creators")
        .select("user_id, display_name, users(username)")
        .eq("id", creatorId)
        .single();
      
      if (error) {
        console.error("Error fetching creator:", error);
        toast({
          title: "Error",
          description: "Failed to follow creator",
          variant: "destructive",
        });
        return;
      }
      
      console.log("Creator data:", creator);
      
      if (creator?.user_id === user.id) {
        toast({
          title: "Cannot Follow Yourself",
          description: "You cannot follow your own creator profile",
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      console.error("Error checking creator ownership:", error);
      toast({
        title: "Error",
        description: "Failed to follow creator",
        variant: "destructive",
      });
      return;
    }
    
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      // First, insert the follow relationship
      const { data: insertData, error: followError } = await supabase
        .from("follows")
        .insert({
          user_id: user.id,
          creator_id: creatorId
        })
        .select('creator_id')
        .single();
      
      if (followError) {
        if (followError.code === "23505") { // Unique constraint violation
          toast({
            description: "You're already following this creator",
          });
          setIsFollowing(true);
        } else {
          throw followError;
        }
      } else {
        console.log("Follow successful");
        toast({
          description: "You are now following this creator",
        });
        setIsFollowing(true);
        
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
        
        // Note: Conversation participants are automatically created by the database trigger
        // when a follow is inserted, so we don't need to manually create them here
        
        // Invalidate relevant queries
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["creatorProfile"] }),
          queryClient.invalidateQueries({ queryKey: ["subscriptions"] }),
          queryClient.invalidateQueries({ queryKey: ["creators"] }),
          queryClient.invalidateQueries({ queryKey: ["followedCreators"] }),
          queryClient.invalidateQueries({ queryKey: ["follows"] }),
          queryClient.invalidateQueries({ queryKey: ["posts"] }),
          queryClient.invalidateQueries({ queryKey: ["conversations"] })
        ]);
      }
    } catch (error: any) {
      console.error("Error following creator:", error);
      
      // Provide more specific error messages
      if (error.message?.includes("row-level security")) {
        toast({
          title: "Permission Error",
          description: "There was an issue with permissions. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to follow creator",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Function to unfollow a creator using follows table
  const unfollowCreator = async (creatorId: string): Promise<void> => {
    if (!user) return;
    
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("user_id", user.id)
        .eq("creator_id", creatorId);
      
      if (error) throw error;
      
      toast({
        description: "You have unfollowed this creator",
      });
      setIsFollowing(false);
      
      // Invalidate relevant queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["creatorProfile"] }),
        queryClient.invalidateQueries({ queryKey: ["subscriptions"] }),
        queryClient.invalidateQueries({ queryKey: ["creators"] }),
        queryClient.invalidateQueries({ queryKey: ["followedCreators"] }),
        queryClient.invalidateQueries({ queryKey: ["follows"] }),
        queryClient.invalidateQueries({ queryKey: ["posts"] }),
        queryClient.invalidateQueries({ queryKey: ["conversations"] })
      ]);
    } catch (error: any) {
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
    setIsFollowing,
    checkFollowStatus,
    followCreator,
    unfollowCreator,
  };
}
