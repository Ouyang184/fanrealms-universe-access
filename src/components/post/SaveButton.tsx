import React from 'react';
import { Button } from '@/components/ui/button';
import { Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSavedPosts } from '@/hooks/useSavedPosts';
import { useAuth } from '@/contexts/AuthContext';

interface SaveButtonProps {
  postId: string;
}

export function SaveButton({ postId }: SaveButtonProps) {
  const { user } = useAuth();
  const { savedPostIds, toggleSave, isSaving } = useSavedPosts();
  const isSaved = savedPostIds.has(postId);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    if (!user) return;
    toggleSave(postId);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSave}
      disabled={!user || isSaving}
      className={cn(
        "flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600 transition-colors",
        isSaved && "text-blue-600"
      )}
    >
      <Bookmark 
        className={cn(
          "h-4 w-4 transition-all",
          isSaved && "fill-current"
        )} 
      />
      <span className="text-sm">
        {isSaved ? 'Saved' : 'Save'}
      </span>
    </Button>
  );
}