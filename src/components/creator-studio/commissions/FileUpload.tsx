
import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Upload, File, Image, Video } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface UploadedFile {
  file: File;
  preview?: string;
  type: 'image' | 'video' | 'document';
}

interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxSizePerFile?: number; // in MB
}

export function FileUpload({ 
  onFilesChange, 
  maxFiles = 10, 
  maxSizePerFile = 50 
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const getFileType = (file: File): 'image' | 'video' | 'document' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    return 'document';
  };

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length + uploadedFiles.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} files allowed`,
        variant: "destructive"
      });
      return;
    }

    const validFiles: UploadedFile[] = [];
    
    files.forEach(file => {
      if (file.size > maxSizePerFile * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds ${maxSizePerFile}MB limit`,
          variant: "destructive"
        });
        return;
      }

      const fileType = getFileType(file);
      const uploadedFile: UploadedFile = { file, type: fileType };

      if (fileType === 'image') {
        uploadedFile.preview = URL.createObjectURL(file);
      }

      validFiles.push(uploadedFile);
    });

    const newFiles = [...uploadedFiles, ...validFiles];
    setUploadedFiles(newFiles);
    onFilesChange(newFiles.map(f => f.file));
  }, [uploadedFiles, maxFiles, maxSizePerFile, onFilesChange]);

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    onFilesChange(newFiles.map(f => f.file));
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <div className="space-y-2">
          <p className="text-sm font-medium">Upload your commission files</p>
          <p className="text-xs text-muted-foreground">
            Images, videos, documents (max {maxSizePerFile}MB each)
          </p>
          <Button variant="outline" size="sm" asChild>
            <label>
              <input
                type="file"
                multiple
                accept="image/*,video/*,.pdf,.doc,.docx,.txt,.psd,.ai,.zip,.rar"
                onChange={handleFileSelect}
                className="hidden"
              />
              Select Files
            </label>
          </Button>
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Uploaded Files ({uploadedFiles.length}/{maxFiles})</p>
          <div className="grid grid-cols-1 gap-2">
            {uploadedFiles.map((uploadedFile, index) => (
              <Card key={index}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {uploadedFile.preview ? (
                        <img 
                          src={uploadedFile.preview} 
                          alt={uploadedFile.file.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                          {getFileIcon(uploadedFile.type)}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium truncate max-w-48">
                          {uploadedFile.file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
