
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, Video, FileIcon, Lock } from "lucide-react";
import { Download as DownloadIcon } from "lucide-react";

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
  };
  onClick: (content: any) => void;
}

export function ContentCard({ content, onClick }: ContentCardProps) {
  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-3 w-3" />;
      case 'article':
        return <FileIcon className="h-3 w-3" />;
      case 'download':
        return <DownloadIcon className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <Card 
      className="bg-gray-900 border-gray-800 overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]" 
      onClick={() => onClick(content)}
    >
      <div className="relative">
        <img
          src={content.thumbnail}
          alt={content.title}
          className="w-full h-40 object-cover"
        />
        <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-xs flex items-center gap-1">
          {getContentTypeIcon(content.type)}
          {content.type.charAt(0).toUpperCase() + content.type.slice(1)}
        </div>
        
        {/* Locked overlay for non-preview content */}
        {!content.preview && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Lock className="h-8 w-8 text-white/70" />
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
        <h3 className="font-semibold line-clamp-2">{content.title}</h3>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-400">
            {content.date}
          </span>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
