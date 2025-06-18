
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Video, FileIcon, Lock, FileImage, FileText, Play, Download } from "lucide-react";
import { NSFWBadge } from "@/components/ui/nsfw-badge";

interface ContentCardProps {
  content: {
    id: number;
    title: string;
    thumbnail: string;
    creator: {
      name: string;
      avatar: string;
    };
    type: string;
    date: string;
    preview: boolean;
    description?: string;
    attachments?: any;
    is_nsfw?: boolean;
  };
  onClick: (content: any) => void;
}

export function ContentCard({ content, onClick }: ContentCardProps) {
  // Helper function to get the first media from attachments
  const getFirstMedia = (attachments: any) => {
    if (!attachments) return null;
    
    let parsedAttachments = [];
    if (typeof attachments === 'string' && attachments !== "undefined") {
      try {
        parsedAttachments = JSON.parse(attachments);
      } catch {
        return null;
      }
    } else if (Array.isArray(attachments)) {
      parsedAttachments = attachments;
    } else if (attachments && typeof attachments === 'object' && attachments.value) {
      if (typeof attachments.value === 'string' && attachments.value !== "undefined") {
        try {
          parsedAttachments = JSON.parse(attachments.value);
        } catch {
          return null;
        }
      } else if (Array.isArray(attachments.value)) {
        parsedAttachments = attachments.value;
      }
    }

    if (Array.isArray(parsedAttachments) && parsedAttachments.length > 0) {
      return parsedAttachments[0];
    }
    
    return null;
  };

  // Get file type label with icon
  const getFileTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return { icon: "📄", label: "PDF" };
      case 'video':
        return { icon: "🎥", label: "Video" };
      case 'image':
        return { icon: "🖼", label: "Image" };
      case 'article':
        return { icon: "📝", label: "Article" };
      case 'download':
        return { icon: "📎", label: "Download" };
      default:
        return { icon: "📎", label: "File" };
    }
  };

  // Get file icon for different file types
  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-600" />;
      case 'video':
        return <Video className="h-8 w-8 text-blue-600" />;
      case 'image':
        return <FileImage className="h-8 w-8 text-green-600" />;
      default:
        return <FileIcon className="h-8 w-8 text-gray-600" />;
    }
  };

  const firstMedia = getFirstMedia(content.attachments);
  const hasVisualMedia = content.thumbnail && !content.thumbnail.includes('placeholder.svg');
  const hasFileAttachment = firstMedia && firstMedia.type !== 'image' && firstMedia.type !== 'video';
  const fileTypeLabel = getFileTypeLabel(content.type);
  const isPremium = !content.preview;

  return (
    <Card className={`bg-gray-900 border-gray-800 overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] ${content.is_nsfw ? 'ring-1 ring-red-500/30' : ''}`} 
      onClick={() => onClick(content)}
    >
      <div className="relative">
        {/* Visual media thumbnail */}
        {hasVisualMedia && (
          <div className="relative w-full h-40">
            <img
              src={content.thumbnail}
              alt={content.title}
              className={`w-full h-full object-cover ${content.is_nsfw ? 'blur-sm hover:blur-none transition-all duration-300' : ''}`}
              onError={(e) => {
                // Hide broken images and show file type instead
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.classList.add('hidden');
              }}
            />
            {/* Video play overlay */}
            {content.type === 'video' && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="bg-black/70 rounded-full p-3">
                  <Play className="h-6 w-6 text-white fill-white" />
                </div>
              </div>
            )}
            
            {/* NSFW Blur Overlay */}
            {content.is_nsfw && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center hover:opacity-0 transition-opacity duration-300">
                <div className="bg-red-600/90 rounded-lg px-3 py-2 text-white font-bold text-sm">
                  18+ Content - Hover to Preview
                </div>
              </div>
            )}
          </div>
        )}

        {/* File attachment display */}
        {(!hasVisualMedia || hasFileAttachment) && (
          <div className={`relative w-full h-40 bg-gray-800 flex items-center justify-center ${content.is_nsfw ? 'border border-red-500/30' : ''}`}>
            <div className="text-center">
              {getFileIcon(content.type)}
              <p className="text-sm text-gray-300 mt-2 px-4 truncate">
                {content.title}
              </p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <span>{fileTypeLabel.icon}</span>
                <span className="text-xs text-gray-400">{fileTypeLabel.label}</span>
              </div>
            </div>
          </div>
        )}

        {/* File type indicator - Always show */}
        <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-xs flex items-center gap-1">
          <span>{fileTypeLabel.icon}</span>
          <span>{fileTypeLabel.label}</span>
        </div>

        {/* NSFW Badge */}
        {content.is_nsfw && (
          <div className="absolute top-2 left-2">
            <NSFWBadge variant="card" />
          </div>
        )}

        {/* Download indicator for file attachments */}
        {(content.type === 'download' || hasFileAttachment) && (
          <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs flex items-center gap-1">
            <Download className="h-3 w-3" />
            Download
          </div>
        )}
        
        {/* Premium lock overlay */}
        {isPremium && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-black/80 rounded-full p-3">
              <Lock className="h-8 w-8 text-white/70" />
            </div>
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={content.creator.avatar} />
            <AvatarFallback className="text-xs">{content.creator.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-gray-400">{content.creator.name}</span>
        </div>
        <div className="flex items-start gap-2 mb-2">
          <h3 className="font-semibold line-clamp-2 flex-1">{content.title}</h3>
          {content.is_nsfw && <NSFWBadge variant="card" />}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-400">
            {content.date}
          </span>
          <div className="flex items-center gap-2">
            <Badge className={`${isPremium ? 'bg-purple-600' : 'bg-green-600'}`}>
              {isPremium ? "Premium" : "Free"}
            </Badge>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
