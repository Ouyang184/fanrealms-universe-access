
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X, Image } from 'lucide-react';

interface SampleImageUploadProps {
  sampleImagePreview: string | null;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
}

export function SampleImageUpload({ 
  sampleImagePreview, 
  onImageUpload, 
  onRemoveImage 
}: SampleImageUploadProps) {
  return (
    <div>
      <Label>Sample Art</Label>
      <div className="mt-2">
        {sampleImagePreview ? (
          <div className="relative inline-block">
            <img
              src={sampleImagePreview}
              alt="Sample art preview"
              loading="lazy"
            />
            <Button
              type="button"
              onClick={onRemoveImage}
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              variant="destructive"
              size="sm"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <input
              type="file"
              accept="image/*"
              onChange={onImageUpload}
              className="hidden"
              id="sample-upload"
            />
            <label
              htmlFor="sample-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Image className="h-8 w-8 text-gray-400" />
              <span className="text-sm text-gray-600">
                Click to upload sample art
              </span>
              <span className="text-xs text-gray-500">
                JPG, PNG up to 10MB
              </span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
