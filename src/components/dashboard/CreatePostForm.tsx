import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from 'react-router-dom';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { TierSelect } from "@/components/dashboard/TierSelect";
import { FileInput } from "@/components/ui/file-input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters.",
  }),
  content: z.string().min(10, {
    message: "Content must be at least 10 characters.",
  }),
});

export default function CreatePostForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isNSFW, setIsNSFW] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  // Get creator profile for NSFW status
  const { data: creatorData } = useQuery({
    queryKey: ['creator-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('creators')
        .select('id, is_nsfw')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching creator:', error);
        return null;
      }
      
      return data as any;
    },
    enabled: !!user?.id
  });

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = form;

  const handleTierSelect = (tierId: string | null) => {
    setSelectedTier(tierId);
  };

  const handleFileChange = (files: File[]) => {
    setAttachments(files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id || !creatorData?.id) {
      toast({
        title: "Error",
        description: "You must be a creator to post content",
        variant: "destructive"
      });
      return;
    }

    const title = form.getValues("title");
    const content = form.getValues("content");

    if (!title || !content) {
      toast({
        title: "Error",
        description: "Please fill out all fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);

      // Auto-flag as NSFW if creator is NSFW
      const shouldAutoFlagNSFW = creatorData?.is_nsfw === true;
      const finalNSFWFlag = shouldAutoFlagNSFW || isNSFW;

      let finalAttachments: any[] = [];

      // Upload attachments
      if (attachments.length > 0) {
        finalAttachments = await Promise.all(
          attachments.map(async (file) => {
            const { data, error } = await supabase.storage
              .from('post-attachments')
              .upload(`${user.id}/${Date.now()}-${file.name}`, file, {
                cacheControl: '3600',
                upsert: false
              });

            if (error) {
              console.error("Error uploading file:", error);
              toast({
                title: "Error",
                description: "Failed to upload attachment",
                variant: "destructive"
              });
              return null;
            }

            const publicURL = supabase.storage
              .from('post-attachments')
              .getPublicUrl(data.path);

            const fileType = file.type.startsWith('image/') ? 'image' : 'video';

            return {
              url: publicURL.data.publicUrl,
              type: fileType
            };
          })
        ).then(results => results.filter(result => result !== null));
      }

      // Create the post
      const { data: newPost, error: postError } = await supabase
        .from('posts')
        .insert({
          title,
          content,
          author_id: user.id,
          creator_id: creatorData.id,
          tier_id: selectedTier || null,
          attachments: finalAttachments,
          is_nsfw: finalNSFWFlag
        })
        .select()
        .single();

      if (postError) {
        throw postError;
      }

      toast({
        title: "Success",
        description: "Post created successfully!",
      });

      // Invalidate queries for posts
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["user-posts", user.id] });

      navigate(`/posts/${newPost.id}`);
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create post",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="My awesome post"
              type="text"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Write something..."
              rows={5}
              {...register("content")}
            />
            {errors.content && (
              <p className="text-sm text-red-500">{errors.content.message}</p>
            )}
          </div>

          <TierSelect onTierSelect={handleTierSelect} />

          <div>
            <Label>Attachments</Label>
            <FileInput onChange={handleFileChange} />
          </div>
          
          {/* NSFW Toggle */}
          {(creatorData?.is_nsfw || isNSFW) && (
            <div className="flex items-center space-x-2">
              <Label htmlFor="nsfw">NSFW</Label>
              <Switch id="nsfw" checked={isNSFW} onCheckedChange={setIsNSFW} />
            </div>
          )}

          <Button disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Post"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
