
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useNotificationActions } from "./useNotificationActions";

export function useFollowActions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { createFollowNotification } = useNotificationActions();

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

  const performFollowOperation = async (creatorId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to follow a creator",
        variant: "destructive",
      });
      throw new Error("No user authenticated");
    }
    
    console.log("Following creator:", creatorId, "User:", user.id);
    
    // Get current creator data
    const { data: creator, error } = await supabase
      .from("creators")
      .select("user_id, display_name, users(username), follower_count")
      .eq("id", creatorId)
      .single();
    
    if (error) {
      console.error("Error fetching creator:", error);
      toast({
        title: "Error",
        description: "Failed to follow creator",
        variant: "destructive",
      });
      throw error;
    }
    
    console.log("Creator data:", creator);
    
    if (creator?.user_id === user.id) {
      toast({
        title: "Cannot Follow Yourself",
        description: "You cannot follow your own creator profile",
        variant: "destructive",
      });
      throw new Error("Cannot follow yourself");
    }

    // Insert the follow relationship
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
        return { alreadyFollowing: true, currentFollowerCount: creator.follower_count || 0 };
      } else {
        console.error("Follow error:", followError);
        throw followError;
      }
    } else {
      console.log("Follow successful");
      toast({
        description: "You are now following this creator",
      });
      
      // Create follow notification
      try {
        await createFollowNotification(creatorId, creator.user_id);
        console.log("Follow notification created successfully");
      } catch (notificationError) {
        console.error("Failed to create follow notification:", notificationError);
        // Don't fail the follow action if notification creation fails
      }
      
      return { alreadyFollowing: false, currentFollowerCount: creator.follower_count || 0 };
    }
  };

  const performUnfollowOperation = async (creatorId: string) => {
    if (!user) throw new Error("No user authenticated");
    
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("user_id", user.id)
      .eq("creator_id", creatorId);
    
    if (error) {
      console.error("Unfollow error:", error);
      throw error;
    }
    
    console.log("Unfollow successful");
    toast({
      description: "You have unfollowed this creator",
    });
  };

  return {
    checkFollowStatus,
    performFollowOperation,
    performUnfollowOperation,
  };
}
