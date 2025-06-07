
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface MessageImageProps {
  src: string;
  alt: string;
  className?: string;
  canDelete?: boolean;
  onDelete?: () => Promise<void>;
}

export function MessageImage({ src, alt, className = "", canDelete = false, onDelete }: MessageImageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (imageError) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 text-center text-gray-400 max-w-xs">
        <p className="text-sm">Failed to load image</p>
      </div>
    );
  }

  const handleDelete = async () => {
    if (onDelete && !isDeleting) {
      setIsDeleting(true);
      console.log('MessageImage: Starting delete process...');
      try {
        await onDelete();
        console.log('MessageImage: Delete completed, closing dialog');
        setIsOpen(false);
      } catch (error) {
        console.error('MessageImage: Error deleting image:', error);
        // Don't close dialog on error
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <>
      <div className={`relative cursor-pointer ${className}`}>
        <img
          src={src}
          alt={alt}
          className="rounded-lg max-w-xs max-h-60 object-cover hover:opacity-90 transition-opacity"
          onClick={() => setIsOpen(true)}
          onError={() => setImageError(true)}
        />
      </div>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl p-0 bg-transparent border-none">
          <VisuallyHidden>
            <DialogTitle>Image Viewer</DialogTitle>
            <DialogDescription>Full size image view with delete option</DialogDescription>
          </VisuallyHidden>
          <div className="relative">
            <img
              src={src}
              alt={alt}
              className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
            />
            {canDelete && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeleting ? 'Deleting...' : 'Delete Image'}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
