
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from 'react-router-dom';
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

export default function CreatePostForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isNSFW, setIsNSFW] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // Get creator profile for NSFW status
  const { data: creatorData } = useQuery({
    queryKey: ['creator-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('creators')
        .select('id, is_nsfw')
        .eq('user_id', user.id as any)
        .single();
      
      if (error) {
        console.error('Error fetching creator:', error);
        return null;
      }
      
      return data as any;
    },
    enabled: !!user?.id
  });

  const handleTierSelect = (tierId: string | null) => {
    setSelectedTier(tierId);
  };

  const handleFileChange = (files: File[]) => {
    setAttachments(files);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id || !creatorData?.id) {
      toast({
        title: "Error",
        description: "You must be a creator to post content",
        variant: "destructive"
      });
      return;
    }

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
      const shouldAutoFlagNSFW = (creatorData as any)?.is_nsfw === true;
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
          creator_id: (creatorData as any).id,
          tier_id: selectedTier || null,
          attachments: finalAttachments,
          is_nsfw: finalNSFWFlag
        } as any)
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

      navigate(`/posts/${(newPost as any).id}`);
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
    <Card className="w-full max-w-2xl mx-auto p-6">
      <form onSubmit={handleFormSubmit}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="My awesome post"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Write something..."
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <TierSelect onTierSelect={handleTierSelect} selectedTier={selectedTier} />

          <div>
            <Label>Attachments</Label>
            <FileInput onChange={handleFileChange} />
          </div>
          
          {/* NSFW Toggle */}
          {((creatorData as any)?.is_nsfw || isNSFW) && (
            <div className="flex items-center space-x-2">
              <Label htmlFor="nsfw">NSFW</Label>
              <Switch id="nsfw" checked={isNSFW} onCheckedChange={setIsNSFW} />
            </div>
          )}

          <Button disabled={isLoading} type="submit">
            {isLoading ? "Creating..." : "Create Post"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
