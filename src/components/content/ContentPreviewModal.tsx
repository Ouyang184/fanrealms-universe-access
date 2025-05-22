
import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Video, FileIcon, Download as DownloadIcon, Lock } from "lucide-react";

interface ContentPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: {
    id: number;
    title: string;
    description: string;
    type: string;
    creator: {
      name: string;
      avatar: string;
    };
    thumbnail: string;
    preview: boolean;
    sampleContent?: React.ReactNode;
    downloadUrl?: string;
  };
}

export function ContentPreviewModal({ open, onOpenChange, content }: ContentPreviewModalProps) {
  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4 mr-1" />;
      case 'article':
        return <FileIcon className="h-4 w-4 mr-1" />;
      case 'download':
        return <DownloadIcon className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  const renderContent = () => {
    if (!content.preview) {
      return (
        <div className="relative my-6 rounded-lg overflow-hidden">
          <img
            src={content.thumbnail}
            alt={content.title}
            className="w-full h-64 object-cover opacity-50"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
            <Lock className="h-12 w-12 text-white/60 mb-2" />
            <p className="text-xl font-medium text-white">Premium Content</p>
            <p className="text-sm text-gray-300 mt-1">Subscribe to unlock this content</p>
            <Button className="mt-4 bg-purple-600 hover:bg-purple-700">
              Subscribe Now
            </Button>
          </div>
        </div>
      );
    }

    switch (content.type) {
      case 'video':
        return (
          <div className="my-4">
            <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
              <video 
                controls 
                poster={content.thumbnail}
                className="w-full max-h-[400px] rounded-lg"
              >
                <source src="https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="mt-4 text-sm text-gray-400">
              Sample video content. In a real application, this would be the actual premium content.
            </div>
          </div>
        );
      case 'article':
        return (
          <div className="my-4 prose prose-invert max-w-none">
            <img src={content.thumbnail} alt={content.title} className="w-full rounded-lg mb-4" />
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean euismod bibendum laoreet. Proin gravida dolor sit amet lacus accumsan et viverra justo commodo.</p>
            <p>Proin sodales pulvinar tempor. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.</p>
            <h3>Key Insights</h3>
            <ul>
              <li>Nam fermentum, nulla luctus pharetra vulputate, felis tellus mollis orci, sed rhoncus sapien nunc eget odio.</li>
              <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</li>
              <li>Aenean euismod bibendum laoreet.</li>
            </ul>
            <p>Donec sed odio dui. Nullam quis risus eget urna mollis ornare vel eu leo. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.</p>
            <div className="text-sm text-gray-400 mt-4">
              Sample article content. In a real application, this would be the complete article.
            </div>
          </div>
        );
      case 'download':
        return (
          <div className="my-4">
            <img src={content.thumbnail} alt={content.title} className="w-full rounded-lg mb-4" />
            <div className="p-4 border border-gray-800 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Download Contents:</h3>
              <ul className="space-y-2">
                <li className="flex items-center justify-between p-2 bg-gray-900 rounded">
                  <span>sample-file-1.zip (125 MB)</span>
                  <Button size="sm">
                    <DownloadIcon className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </li>
                <li className="flex items-center justify-between p-2 bg-gray-900 rounded">
                  <span>documentation.pdf (3.2 MB)</span>
                  <Button size="sm">
                    <DownloadIcon className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </li>
                <li className="flex items-center justify-between p-2 bg-gray-900 rounded">
                  <span>bonus-content.zip (78 MB)</span>
                  <Button size="sm">
                    <DownloadIcon className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </li>
              </ul>
            </div>
            <div className="mt-4 text-sm text-gray-400">
              Sample download files. In a real application, these would be actual downloadable files.
            </div>
          </div>
        );
      default:
        return content.sampleContent || <p>No preview available</p>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={content.creator.avatar} />
              <AvatarFallback>{content.creator.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span>{content.creator.name}</span>
            <Badge className="ml-2 flex items-center gap-1">
              {getContentTypeIcon(content.type)}
              {content.type.charAt(0).toUpperCase() + content.type.slice(1)}
            </Badge>
          </div>
          <DialogTitle className="text-xl">{content.title}</DialogTitle>
          <DialogDescription>{content.description}</DialogDescription>
        </DialogHeader>

        {renderContent()}

        <DialogFooter>
          {content.preview ? (
            <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-400">
                {content.type === 'download' ? 'These are sample files' : 'This is a preview of the content'}
              </div>
              <Button className="bg-purple-600 hover:bg-purple-700">
                Visit Creator Page
              </Button>
            </div>
          ) : (
            <Button className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700">
              Subscribe to Access
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
