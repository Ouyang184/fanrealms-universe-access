
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

export function useCreatorProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

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
    mutationFn: async (displayName?: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('creators')
        .insert([{
          user_id: user.id,
          bio: '',
          profile_image_url: null,
          display_name: displayName || null
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
      navigate('/creator-studio/dashboard');
      setShowModal(false);
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
    isCreator: !!creatorProfile,
    createProfile: createProfile.mutate,
    isCreating: createProfile.isPending,
    showModal,
    setShowModal
  };
}
