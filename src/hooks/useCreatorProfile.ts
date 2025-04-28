
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export function useCreatorProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: creatorProfile, isLoading } = useQuery({
    queryKey: ['creator-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('creators')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching creator profile:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!user?.id
  });

  const createProfile = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('creators')
        .insert([{
          user_id: user.id,
          bio: '',
          profile_image_url: null
        }])
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-profile'] });
      toast({
        title: "Profile created",
        description: "Your creator profile has been created successfully!",
      });
      navigate('/creator-studio');
    },
    onError: (error) => {
      console.error('Error creating creator profile:', error);
      toast({
        title: "Error",
        description: "Failed to create your creator profile. Please try again.",
        variant: "destructive",
      });
    }
  });

  return {
    creatorProfile,
    isLoading,
    createProfile: createProfile.mutate,
    isCreating: createProfile.isPending
  };
}
