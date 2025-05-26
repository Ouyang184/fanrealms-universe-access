
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Upload, X, FileText, Video, Image as ImageIcon, Music } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface AttachmentFile {
  file: File;
  id: string;
  type: 'image' | 'video' | 'audio' | 'pdf' | 'other';
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
    'image/webp': 'webp',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'video/mpeg': 'mpeg',
    'video/quicktime': 'mov',
    'video/x-msvideo': 'avi',
    'video/webm': 'webm',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/aac': 'aac',
    'audio/m4a': 'm4a',
    'application/pdf': 'pdf'
  };

  // File size limits per type (in bytes)
  const FILE_SIZE_LIMITS = {
    image: 15 * 1024 * 1024,    // 15MB
    video: 200 * 1024 * 1024,   // 200MB  
    audio: 50 * 1024 * 1024,    // 50MB
    pdf: 25 * 1024 * 1024,      // 25MB
    other: 25 * 1024 * 1024     // 25MB
  };

  const MAX_TOTAL_SIZE = 500 * 1024 * 1024; // 500MB per post

  const getFileType = (file: File): 'image' | 'video' | 'audio' | 'pdf' | 'other' => {
    console.log('File type:', file.type, 'File name:', file.name);
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type === 'application/pdf') return 'pdf';
    
    // Fallback: check file extension if MIME type is not recognized
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (['mp4', 'mpeg', 'mov', 'avi', 'webm'].includes(extension || '')) return 'video';
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension || '')) return 'image';
    if (['mp3', 'wav', 'ogg', 'aac', 'm4a'].includes(extension || '')) return 'audio';
    if (extension === 'pdf') return 'pdf';
    
    return 'other'; // fallback
  };

  const getFileIcon = (type: 'image' | 'video' | 'audio' | 'pdf' | 'other') => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'audio':
        return <Music className="h-4 w-4" />;
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getTotalSize = (currentAttachments: AttachmentFile[]) => {
    return currentAttachments.reduce((total, att) => total + att.file.size, 0);
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newAttachments: AttachmentFile[] = [];

    Array.from(files).forEach((file) => {
      console.log('Processing file:', file.name, 'Type:', file.type, 'Size:', file.size);
      
      // More lenient file type validation
      const fileType = getFileType(file);
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      // Check if it's a supported file type
      const isValidType = Object.keys(ACCEPTED_FILE_TYPES).includes(file.type) || 
                         ['mp4', 'mpeg', 'mov', 'avi', 'webm', 'jpg', 'jpeg', 'png', 'webp', 'gif', 'mp3', 'wav', 'ogg', 'aac', 'm4a', 'pdf'].includes(extension || '');
      
      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported file type. Please use supported image, video, audio, or PDF files.`,
          variant: "destructive",
        });
        return;
      }

      // Validate file size based on type
      const sizeLimit = FILE_SIZE_LIMITS[fileType];
      if (file.size > sizeLimit) {
        toast({
          title: "File too large",
          description: `${file.name} is too large. Maximum size for ${fileType} files is ${formatFileSize(sizeLimit)}.`,
          variant: "destructive",
        });
        return;
      }

      // Check total size limit
      const currentTotalSize = getTotalSize(attachments);
      const newTotalSize = currentTotalSize + file.size;
      if (newTotalSize > MAX_TOTAL_SIZE) {
        toast({
          title: "Total size limit exceeded",
          description: `Adding this file would exceed the 500MB total limit per post. Current total: ${formatFileSize(currentTotalSize)}.`,
          variant: "destructive",
        });
        return;
      }

      newAttachments.push({
        file,
        id: Math.random().toString(36).substr(2, 9),
        type: fileType
      });
      
      console.log('Added file:', file.name, 'as type:', fileType);
    });

    if (newAttachments.length > 0) {
      onAttachmentsChange([...attachments, ...newAttachments]);
      toast({
        title: "Files added",
        description: `${newAttachments.length} file(s) added successfully.`,
      });
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

  const currentTotalSize = getTotalSize(attachments);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>File Attachments (Optional)</Label>
        <div className="text-xs text-muted-foreground">
          Total: {formatFileSize(currentTotalSize)} / 500MB
        </div>
      </div>
      
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
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Supported formats: Images, Videos, Audio, PDFs</p>
          <p>Limits: Images (15MB) • Videos (200MB) • Audio (50MB) • Others (25MB)</p>
        </div>
        <input
          id="file-upload"
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.mp4,.mpeg,.mov,.avi,.webm,.mp3,.wav,.ogg,.aac,.m4a,video/*,image/*,audio/*,application/pdf"
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
                        {formatFileSize(attachment.file.size)}
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
