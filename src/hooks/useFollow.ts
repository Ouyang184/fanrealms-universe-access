
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
        .select("id")
        .eq("user_id", user.id)
        .eq("creator_id", creatorId)
        .single();
      
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
      const { data: insertData, error } = await supabase
        .from("follows")
        .insert({
          user_id: user.id,
          creator_id: creatorId
        })
        .select('creator_id')
        .single();
      
      if (error) {
        if (error.code === "23505") { // Unique constraint violation
          toast({
            description: "You're already following this creator",
          });
          setIsFollowing(true);
        } else {
          throw error;
        }
      } else {
        console.log("Follow successful, creating notification...");
        toast({
          description: "You are now following this creator",
        });
        setIsFollowing(true);
        
        // Create follow notification - get the creator's user_id for the notification
        const { data: creatorData } = await supabase
          .from("creators")
          .select("user_id")
          .eq("id", creatorId)
          .single();
          
        console.log("Creator user_id for notification:", creatorData?.user_id);
          
        if (creatorData?.user_id) {
          console.log("Creating follow notification...");
          try {
            await createFollowNotification(creatorId, creatorData.user_id);
            console.log("Follow notification created successfully");
          } catch (notificationError) {
            console.error("Failed to create follow notification:", notificationError);
            // Don't fail the follow action if notification creation fails
          }
        } else {
          console.error("Could not find creator user_id for notification");
        }
        
        // Invalidate all relevant queries to refresh data immediately
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["creatorProfile"] }),
          queryClient.invalidateQueries({ queryKey: ["subscriptions"] }),
          queryClient.invalidateQueries({ queryKey: ["creators"] }),
          queryClient.invalidateQueries({ queryKey: ["followedCreators"] }),
          queryClient.invalidateQueries({ queryKey: ["follows"] }),
          queryClient.invalidateQueries({ queryKey: ["posts"] }),
          queryClient.invalidateQueries({ queryKey: ["notifications"] })
        ]);
      }
    } catch (error: any) {
      console.error("Error following creator:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to follow creator",
        variant: "destructive",
      });
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
      
      // Invalidate all relevant queries to refresh data immediately
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["creatorProfile"] }),
        queryClient.invalidateQueries({ queryKey: ["subscriptions"] }),
        queryClient.invalidateQueries({ queryKey: ["creators"] }),
        queryClient.invalidateQueries({ queryKey: ["followedCreators"] }),
        queryClient.invalidateQueries({ queryKey: ["follows"] }),
        queryClient.invalidateQueries({ queryKey: ["posts"] })
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
