
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  Share2, 
  Link, 
  Twitter, 
  Facebook, 
  Linkedin, 
  Mail, 
  MessageCircle,
  Code,
  Copy,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ShareButtonProps {
  postId: string;
  postTitle: string;
  postContent: string;
  creatorName: string;
  creatorUsername?: string;
  isPublic?: boolean;
  className?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  postId,
  postTitle,
  postContent,
  creatorName,
  creatorUsername,
  isPublic = true,
  className = ""
}) => {
  const [showEmbedDialog, setShowEmbedDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);

  // Generate shareable URL
  const getShareableUrl = () => {
    const baseUrl = window.location.origin;
    const creatorSlug = creatorUsername || creatorName.toLowerCase().replace(/\s+/g, '-');
    return `${baseUrl}/${creatorSlug}/posts/${postId}`;
  };

  // Track share action
  const trackShare = async (platform: string) => {
    try {
      await supabase
        .from('post_shares')
        .insert({
          post_id: postId,
          platform: platform,
          shared_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error tracking share:', error);
    }
  };

  // Share to different platforms
  const shareToTwitter = () => {
    const url = getShareableUrl();
    const text = `Check out "${postTitle}" by ${creatorName}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank');
    trackShare('twitter');
  };

  const shareToFacebook = () => {
    const url = getShareableUrl();
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank');
    trackShare('facebook');
  };

  const shareToLinkedIn = () => {
    const url = getShareableUrl();
    const title = `${postTitle} by ${creatorName}`;
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
    window.open(linkedinUrl, '_blank');
    trackShare('linkedin');
  };

  const shareToReddit = () => {
    const url = getShareableUrl();
    const title = `${postTitle} by ${creatorName}`;
    const redditUrl = `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
    window.open(redditUrl, '_blank');
    trackShare('reddit');
  };

  const shareViaEmail = () => {
    const url = getShareableUrl();
    const subject = `Check out "${postTitle}" by ${creatorName}`;
    const body = `I thought you might find this interesting:\n\n"${postTitle}" by ${creatorName}\n\n${url}`;
    const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(emailUrl);
    trackShare('email');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareableUrl());
      toast.success('Link copied to clipboard!');
      trackShare('copy_link');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const getEmbedCode = () => {
    const url = getShareableUrl();
    const previewText = postContent.length > 100 ? postContent.substring(0, 100) + '...' : postContent;
    
    return `<div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; max-width: 500px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">${postTitle}</h3>
  <p style="margin: 0 0 12px 0; color: #64748b; font-size: 14px;">by ${creatorName}</p>
  <p style="margin: 0 0 12px 0; line-height: 1.5;">${previewText}</p>
  <a href="${url}" target="_blank" style="display: inline-flex; align-items: center; gap: 4px; color: #3b82f6; text-decoration: none; font-size: 14px;">
    Read more <span style="font-size: 12px;">↗</span>
  </a>
</div>`;
  };

  const copyEmbedCode = async () => {
    try {
      await navigator.clipboard.writeText(getEmbedCode());
      toast.success('Embed code copied to clipboard!');
      trackShare('embed');
    } catch (error) {
      toast.error('Failed to copy embed code');
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600 ${className}`}
          >
            <Share2 className="h-4 w-4" />
            <span className="text-sm">Share</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={copyLink} className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            Copy Link
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={shareToTwitter} className="flex items-center gap-2">
            <Twitter className="h-4 w-4" />
            Share to Twitter
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={shareToFacebook} className="flex items-center gap-2">
            <Facebook className="h-4 w-4" />
            Share to Facebook
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={shareToLinkedIn} className="flex items-center gap-2">
            <Linkedin className="h-4 w-4" />
            Share to LinkedIn
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={shareToReddit} className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Share to Reddit
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={shareViaEmail} className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Share via Email
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setShowEmbedDialog(true)} className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Embed Post
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setShowLinkDialog(true)} className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            View Shareable Link
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Embed Dialog */}
      <Dialog open={showEmbedDialog} onOpenChange={setShowEmbedDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Embed Post</DialogTitle>
            <DialogDescription>
              Copy this HTML code to embed the post on your website or blog.
              {!isPublic && " Note: Private posts will show a login prompt for unauthorized users."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative">
              <textarea
                readOnly
                value={getEmbedCode()}
                className="w-full h-32 p-3 text-sm font-mono bg-gray-50 border rounded-md resize-none"
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={copyEmbedCode} className="flex-1">
                <Copy className="h-4 w-4 mr-2" />
                Copy Embed Code
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Shareable Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Shareable Link</DialogTitle>
            <DialogDescription>
              Anyone with this link can {isPublic ? 'view the post' : 'see a preview (full access requires login)'}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                readOnly
                value={getShareableUrl()}
                className="flex-1"
              />
              <Button onClick={copyLink} size="sm">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
