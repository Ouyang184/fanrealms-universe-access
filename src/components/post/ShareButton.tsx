
import React, { useState } from 'react';
import { Share2, Copy, Twitter, Facebook, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ShareButtonProps {
  postId: string;
  title?: string;
  postTitle?: string;
  postContent?: string;
  creatorName?: string;
  creatorUsername?: string;
  isPublic?: boolean;
  className?: string;
}

export function ShareButton({ 
  postId, 
  title = "Check out this post!", 
  postTitle,
  postContent,
  creatorName,
  creatorUsername,
  isPublic,
  className
}: ShareButtonProps) {
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);

  const postUrl = `${window.location.origin}/post/${postId}`;
  const shareTitle = postTitle || title;

  const handleShare = async (platform: string) => {
    if (isSharing) return;
    
    setIsSharing(true);
    
    try {
      // Log the share action
      await supabase
        .from('post_shares')
        .insert({
          post_id: postId,
          platform,
          shared_at: new Date().toISOString(),
        } as any);

      let shareUrl = '';
      
      switch (platform) {
        case 'twitter':
          shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(postUrl)}`;
          break;
        case 'facebook':
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
          break;
        case 'copy':
          await navigator.clipboard.writeText(postUrl);
          toast({
            title: "Link copied!",
            description: "Post link has been copied to your clipboard.",
          });
          return;
        default:
          return;
      }

      if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
      }

      toast({
        title: "Shared!",
        description: `Post shared on ${platform}`,
      });

    } catch (error) {
      console.error('Error sharing post:', error);
      toast({
        title: "Error",
        description: "Failed to share post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          url: postUrl,
        });
        
        // Log native share
        await handleShare('native');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`text-muted-foreground hover:text-foreground ${className || ''}`}
          disabled={isSharing}
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {navigator.share && (
          <>
            <DropdownMenuItem onClick={handleNativeShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share...
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={() => handleShare('copy')}>
          <Copy className="mr-2 h-4 w-4" />
          Copy link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('twitter')}>
          <Twitter className="mr-2 h-4 w-4" />
          Share on Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('facebook')}>
          <Facebook className="mr-2 h-4 w-4" />
          Share on Facebook
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
