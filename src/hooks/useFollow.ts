
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
    
    // Check if user is trying to follow themselves
    try {
      const { data: creator, error } = await supabase
        .from("creators")
        .select("user_id")
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
      const { error } = await supabase
        .from("follows")
        .insert({
          user_id: user.id,
          creator_id: creatorId
        });
      
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
        toast({
          description: "You are now following this creator",
        });
        setIsFollowing(true);
        
        // Invalidate all relevant queries to refresh data immediately
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["creatorProfile"] }),
          queryClient.invalidateQueries({ queryKey: ["subscriptions"] }),
          queryClient.invalidateQueries({ queryKey: ["creators"] }),
          queryClient.invalidateQueries({ queryKey: ["followedCreators"] }),
          queryClient.invalidateQueries({ queryKey: ["follows"] }),
          queryClient.invalidateQueries({ queryKey: ["posts"] })
        ]);
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
