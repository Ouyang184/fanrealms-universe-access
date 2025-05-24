
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Upload, X, FileText, Video, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface AttachmentFile {
  file: File;
  id: string;
  type: 'image' | 'video' | 'pdf';
}

interface FileAttachmentProps {
  attachments: AttachmentFile[];
  onAttachmentsChange: (attachments: AttachmentFile[]) => void;
  disabled?: boolean;
}

export function FileAttachment({ attachments, onAttachmentsChange, disabled }: FileAttachmentProps) {
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();

  const ACCEPTED_FILE_TYPES = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg', 
    'image/png': 'png',
    'video/mp4': 'mp4',
    'video/mpeg': 'mpeg',
    'video/quicktime': 'mov',
    'application/pdf': 'pdf'
  };

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  const getFileType = (file: File): 'image' | 'video' | 'pdf' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type === 'application/pdf') return 'pdf';
    return 'pdf'; // fallback
  };

  const getFileIcon = (type: 'image' | 'video' | 'pdf') => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'pdf':
        return <FileText className="h-4 w-4" />;
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newAttachments: AttachmentFile[] = [];

    Array.from(files).forEach((file) => {
      // Validate file type
      if (!Object.keys(ACCEPTED_FILE_TYPES).includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported file type. Please use JPG, PNG, PDF, or video files.`,
          variant: "destructive",
        });
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File too large",
          description: `${file.name} is too large. Maximum file size is 50MB.`,
          variant: "destructive",
        });
        return;
      }

      newAttachments.push({
        file,
        id: Math.random().toString(36).substr(2, 9),
        type: getFileType(file)
      });
    });

    if (newAttachments.length > 0) {
      onAttachmentsChange([...attachments, ...newAttachments]);
    }
  };

  const removeAttachment = (id: string) => {
    onAttachmentsChange(attachments.filter(attachment => attachment.id !== id));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!disabled) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  return (
    <div className="space-y-4">
      <Label>File Attachments (Optional)</Label>
      
      {/* File Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && document.getElementById('file-upload')?.click()}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-2">
          Drag and drop files here, or click to select
        </p>
        <p className="text-xs text-muted-foreground">
          Supports JPG, PNG, PDF, and video files (max 50MB each)
        </p>
        <input
          id="file-upload"
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.pdf,.mp4,.mpeg,.mov"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={disabled}
        />
      </div>

      {/* Attached Files List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm">Attached Files ({attachments.length})</Label>
          <div className="grid gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  {getFileIcon(attachment.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {attachment.file.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {attachment.type.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {(attachment.file.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAttachment(attachment.id)}
                  disabled={disabled}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
