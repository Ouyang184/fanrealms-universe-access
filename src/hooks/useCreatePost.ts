
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
    tags: string[];
    selectedTierIds: string[] | null;
    attachments: AttachmentFile[];
  }) => {
    if (!user) return false;
    
    if (!creatorProfile?.id) {
      toast({
        title: "Create a creator profile",
        description: "You need a creator profile before you can publish posts.",
        variant: "destructive",
      });
      return false;
    }
    
    console.log('Form submission started with selectedTierIds:', formData.selectedTierIds);
    console.log('Creator NSFW setting:', creatorProfile?.is_nsfw);
    
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
      const isNSFW = creatorProfile?.is_nsfw || false;

      const postData = {
        title: formData.title,
        content: formData.content,
        author_id: user.id,
        creator_id: creatorProfile?.id || null,
        tier_id: formData.selectedTierIds && formData.selectedTierIds.length === 1 ? formData.selectedTierIds[0] : null,
        attachments: uploadedAttachments,
        tags: formData.tags,
        is_nsfw: isNSFW,
        status: 'published',
        scheduled_for: null,
      };

      console.log('Creating post with automatic NSFW flag:', { 
        ...postData, 
        creatorNSFWSetting: creatorProfile?.is_nsfw,
        autoFlaggedNSFW: isNSFW 
      });

      const { data: insertedPost, error } = await supabase
        .from('posts')
        .insert([postData])
        .select('*');

      if (error) throw error;

      // Handle multiple tier assignments
      if (formData.selectedTierIds && formData.selectedTierIds.length > 0 && insertedPost[0]) {
        const postTierInserts = formData.selectedTierIds.map(tierId => ({
          post_id: insertedPost[0].id,
          tier_id: tierId
        }));

        const { error: tierError } = await supabase
          .from('post_tiers')
          .insert(postTierInserts);

        if (tierError) {
          console.error('Error assigning tiers to post:', tierError);
        }
      }

      console.log('Post created successfully with NSFW flag:', insertedPost[0]?.is_nsfw);

      // Send email notifications to followers
      if (insertedPost[0] && creatorProfile?.id) {
        try {
          await supabase.functions.invoke('send-new-post-notification', {
            body: {
              postId: insertedPost[0].id,
              creatorId: creatorProfile.id
            }
          });
          console.log('Email notifications sent successfully');
        } catch (emailError) {
          console.error('Failed to send email notifications:', emailError);
          // Don't fail the post creation if email fails
        }
      }

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
      const errMsg = (error && (error.message || (typeof error === 'string' ? error : 'Failed to create post. Please try again.'))) || 'Failed to create post. Please try again.';
      const errCode = (error && (error as any).code) ? ` (code: ${(error as any).code})` : '';
      toast({
        title: "Post not created",
        description: `${errMsg}${errCode}`,
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
