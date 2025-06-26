
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Copy, Facebook, Twitter, MessageCircle } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { usePostShares } from '@/hooks/usePostShares';
import { cn } from '@/lib/utils';

interface ShareButtonProps {
  postId: string;
  postTitle: string;
  postContent: string;
  creatorName: string;
  creatorUsername?: string;
  isPublic?: boolean;
  className?: string;
}

export function ShareButton({ 
  postId, 
  postTitle, 
  postContent, 
  creatorName, 
  creatorUsername,
  isPublic = true,
  className
}: ShareButtonProps) {
  const { toast } = useToast();
  const { shareCount } = usePostShares(postId);
  const [isOpen, setIsOpen] = useState(false);
  
  const shareUrl = `${window.location.origin}/post/${postId}`;
  const shareText = `Check out this post by ${creatorName}: ${postTitle}`;

  const handleShare = (platform: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    let url = '';
    
    switch (platform) {
      case 'copy':
        navigator.clipboard.writeText(shareUrl);
        toast({ description: 'Link copied to clipboard!' });
        setIsOpen(false);
        return;
        
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
        
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
        
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
        break;
    }
    
    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
      setIsOpen(false);
    }
  };

  const handleTogglePopover = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    setIsOpen(!isOpen);
  };

  if (!isPublic) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled
        className={cn("flex items-center gap-2 opacity-50", className)}
      >
        <Share2 className="h-4 w-4" />
        <span className="text-sm">Private</span>
      </Button>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleTogglePopover}
          className={cn("flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600 transition-colors", className)}
        >
          <Share2 className="h-4 w-4" />
          <span className="text-sm">
            {shareCount === 0 ? 'Share' : shareCount}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-48 p-2" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={(e) => handleShare('copy', e)}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={(e) => handleShare('facebook', e)}
          >
            <Facebook className="h-4 w-4 mr-2" />
            Facebook
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={(e) => handleShare('twitter', e)}
          >
            <Twitter className="h-4 w-4 mr-2" />
            Twitter
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={(e) => handleShare('whatsapp', e)}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            WhatsApp
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
