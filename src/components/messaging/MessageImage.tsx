
import React, { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface MessageImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function MessageImage({ src, alt, className = "" }: MessageImageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 text-center text-gray-400 max-w-xs">
        <p className="text-sm">Failed to load image</p>
      </div>
    );
  }

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
          <img
            src={src}
            alt={alt}
            className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
