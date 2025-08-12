
import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Video, Image as ImageIcon, Download, ExternalLink } from 'lucide-react';
import { getSignedUrl } from '@/utils/storage';
interface PostAttachment {
  url: string;
  name: string;
  type: 'image' | 'video' | 'pdf';
  size: number;
}

interface PostAttachmentsProps {
  attachments: PostAttachment[];
}

export function PostAttachments({ attachments }: PostAttachmentsProps) {
  const [resolved, setResolved] = useState<PostAttachment[] | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const signed = await Promise.all(
        (attachments || []).map(async (att) => ({
          ...att,
          url: await getSignedUrl(att.url, 'post-attachments', 3600)
        }))
      );
      if (mounted) setResolved(signed);
    })();
    return () => { mounted = false; };
  }, [attachments]);

  const list = resolved || attachments;
  if (!list || list.length === 0) {
    return null;
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
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

  const handleDownload = (url: string, name: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const images = list.filter(att => att.type === 'image');
  const videos = list.filter(att => att.type === 'video');
  const pdfs = list.filter(att => att.type === 'pdf');

  return (
    <div className="mt-4 space-y-4">
      {/* Images Grid - Responsive scaling for modal */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {images.map((attachment, index) => (
            <div key={index} className="relative group">
              <img
                src={attachment.url}
                alt={attachment.name}
                className="w-full h-48 sm:h-56 lg:h-64 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(attachment.url, '_blank')}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(attachment.url, attachment.name);
                  }}
                  className="bg-white/90 hover:bg-white"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Videos - Responsive scaling for modal */}
      {videos.length > 0 && (
        <div className="space-y-3">
          {videos.map((attachment, index) => (
            <div key={index} className="border rounded-lg overflow-hidden">
              <video
                controls
                className="w-full max-h-80 sm:max-h-96"
                preload="metadata"
              >
                <source src={attachment.url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <div className="p-3 bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium truncate">{attachment.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {formatFileSize(attachment.size)}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(attachment.url, attachment.name)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PDFs */}
      {pdfs.length > 0 && (
        <div className="space-y-2">
          {pdfs.map((attachment, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileText className="h-5 w-5 text-red-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{attachment.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">PDF</Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.size)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(attachment.url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(attachment.url, attachment.name)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
