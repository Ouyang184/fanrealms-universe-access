
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export function useFollow() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Function to check if user is following a creator
  const checkFollowStatus = async (creatorId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase
        .from("subscriptions")
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

  // Function to follow a creator
  const followCreator = async (creatorId: string): Promise<void> => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to follow a creator",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from("subscriptions")
        .insert({
          user_id: user.id,
          creator_id: creatorId,
          is_paid: false,
          tier_id: null
        });
      
      if (error) {
        if (error.code === "23505") { // Unique constraint violation
          toast({
            description: "You're already following this creator",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          description: "You are now following this creator",
        });
        setIsFollowing(true);
        queryClient.invalidateQueries({ queryKey: ["creatorProfile"] });
        queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to follow creator",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to unfollow a creator
  const unfollowCreator = async (creatorId: string): Promise<void> => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from("subscriptions")
        .delete()
        .eq("user_id", user.id)
        .eq("creator_id", creatorId);
      
      if (error) throw error;
      
      toast({
        description: "You have unfollowed this creator",
      });
      setIsFollowing(false);
      queryClient.invalidateQueries({ queryKey: ["creatorProfile"] });
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
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
