
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { UseFormReturn } from 'react-hook-form';
import { ProfileImageUpload } from './ProfileImageUpload';
import { TagsSelector } from './TagsSelector';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ProfileData } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

interface ProfileFormValues {
  username: string;
  email?: string;
  profile_picture?: string | null;
  website?: string | null;
  bio?: string | null;
  tags?: string[];
}

interface ProfileEditFormProps {
  form: UseFormReturn<ProfileFormValues>;
  profileData: ProfileData | null;
  userEmail?: string;
  isSubmitting: boolean;
  selectedFile: File | null;
  previewUrl: string | null;
  onSubmit: (data: ProfileFormValues) => Promise<void>;
  onCancel: () => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearImage: () => void;
}

export const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
  form,
  profileData,
  userEmail,
  isSubmitting,
  selectedFile,
  previewUrl,
  onSubmit,
  onCancel,
  onImageChange,
  onClearImage
}) => {
  const { toast } = useToast();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileType = file.type;
      if (!fileType.match(/image\/(jpeg|jpg|png)/)) {
        toast({
          title: "Invalid file",
          description: "Please select a PNG or JPG image.",
          variant: "destructive"
        });
        return;
      }
    }
    onImageChange(e);
  };

  const handleTagAdd = (tag: string) => {
    if (!tag) return;
    
    const currentTags = form.getValues('tags') || [];
    if (currentTags.includes(tag)) return;
    
    form.setValue('tags', [...currentTags, tag]);
  };

  const handleTagRemove = (tag: string) => {
    const currentTags = form.getValues('tags') || [];
    const updatedTags = currentTags.filter(t => t !== tag);
    form.setValue('tags', updatedTags);
  };

  const currentTags = form.watch('tags') || [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input disabled placeholder="Email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <ProfileImageUpload
          profileData={profileData}
          userEmail={userEmail}
          selectedFile={selectedFile}
          previewUrl={previewUrl}
          onImageChange={handleImageChange}
          onClearImage={onClearImage}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder="Tell others about yourself..."
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <TagsSelector
          selectedTags={currentTags}
          onTagAdd={handleTagAdd}
          onTagRemove={handleTagRemove}
        />
        
        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website Link</FormLabel>
              <FormControl>
                <Input 
                  placeholder="https://yourwebsite.com" 
                  {...field} 
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            type="button" 
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? <LoadingSpinner className="mr-2" /> : null}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
};
