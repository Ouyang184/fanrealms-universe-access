
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { AttachmentFile } from "@/components/creator-studio/FileAttachment";

export function useCreatePost() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's creator profile to get creator_id and NSFW status
  const { data: creatorProfile } = useQuery({
    queryKey: ['userCreator', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('creators')
        .select('id, is_nsfw')
        .eq('user_id', user.id as any)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching creator profile:', error);
        return null;
      }
      
      return data as any;
    },
    enabled: !!user?.id
  });

  const uploadFile = async (file: File, userId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('post-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('post-attachments')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: `Failed to upload ${file.name}. Please try again.`,
        variant: "destructive",
      });
      return null;
    }
  };

  const createPost = async (formData: {
    title: string;
    content: string;
    videoUrl: string;
    selectedTierIds: string[] | null;
    attachments: AttachmentFile[];
  }) => {
    if (!user) return;
    
    console.log('Form submission started with selectedTierIds:', formData.selectedTierIds);
    console.log('Creator NSFW setting:', (creatorProfile as any)?.is_nsfw);
    
    setIsLoading(true);
    try {
      // Upload attachments
      const uploadedAttachments = [];
      for (const attachment of formData.attachments) {
        const url = await uploadFile(attachment.file, user.id);
        if (url) {
          uploadedAttachments.push({
            url,
            name: attachment.file.name,
            type: attachment.type,
            size: attachment.file.size
          });
        }
      }

      // Add video URL to attachments if provided
      if (formData.videoUrl) {
        uploadedAttachments.push({
          url: formData.videoUrl,
          name: "Video",
          type: "video",
          size: 0
        });
      }

      // Automatically set NSFW flag based on creator settings
      const isNSFW = (creatorProfile as any)?.is_nsfw || false;

      const postData = {
        title: formData.title,
        content: formData.content,
        author_id: user.id,
        creator_id: (creatorProfile as any)?.id || null,
        tier_id: formData.selectedTierIds && formData.selectedTierIds.length === 1 ? formData.selectedTierIds[0] : null,
        attachments: uploadedAttachments,
        is_nsfw: isNSFW
      };

      console.log('Creating post with automatic NSFW flag:', { 
        ...postData, 
        creatorNSFWSetting: (creatorProfile as any)?.is_nsfw,
        autoFlaggedNSFW: isNSFW 
      });

      const { data: insertedPost, error } = await supabase
        .from('posts')
        .insert([postData as any])
        .select('*');

      if (error) throw error;

      // Handle multiple tier assignments
      if (formData.selectedTierIds && formData.selectedTierIds.length > 0 && insertedPost && insertedPost[0]) {
        const postTierInserts = formData.selectedTierIds.map(tierId => ({
          post_id: (insertedPost[0] as any).id,
          tier_id: tierId
        }));

        const { error: tierError } = await supabase
          .from('post_tiers')
          .insert(postTierInserts as any);

        if (tierError) {
          console.error('Error assigning tiers to post:', tierError);
        }
      }

      console.log('Post created successfully with NSFW flag:', (insertedPost?.[0] as any)?.is_nsfw);

      const postType = formData.selectedTierIds && formData.selectedTierIds.length > 0 ? "premium" : "public";
      const nsfwNotice = isNSFW ? " (automatically flagged as 18+)" : "";
      
      toast({
        title: "Post created",
        description: `Your ${postType} post has been published successfully${nsfwNotice}.`,
      });

      // Refresh posts list
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['creator-posts'] });

      return true;
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create post. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createPost,
    isLoading,
    creatorProfile
  };
}
