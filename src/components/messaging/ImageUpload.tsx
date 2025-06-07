
import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  disabled?: boolean;
}

export function ImageUpload({ onImageSelect, disabled }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    onImageSelect(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-gray-400 hover:text-white"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
      >
        <Image className="h-5 w-5" />
        <span className="sr-only">Upload image</span>
      </Button>
    </>
  );
}
