
import React from "react";
import { Link } from "react-router-dom";
import { 
  Twitter, 
  Instagram, 
  Facebook, 
  Youtube, 
  Twitch, 
  Linkedin, 
  Github, 
  Globe, 
  AtSign 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSocialLinks, SocialLink } from "@/hooks/useSocialLinks";

interface SocialLinksProps {
  creatorId: string;
  className?: string;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "icon";
}

const ICON_MAP: Record<string, React.ReactNode> = {
  twitter: <Twitter className="h-4 w-4" />,
  x: <Twitter className="h-4 w-4" />,
  instagram: <Instagram className="h-4 w-4" />,
  facebook: <Facebook className="h-4 w-4" />,
  youtube: <Youtube className="h-4 w-4" />,
  twitch: <Twitch className="h-4 w-4" />,
  linkedin: <Linkedin className="h-4 w-4" />,
  github: <Github className="h-4 w-4" />,
};

export function SocialLinks({ 
  creatorId, 
  className = "", 
  variant = "outline",
  size = "icon"
}: SocialLinksProps) {
  const { links, isLoading } = useSocialLinks(creatorId);
  
  console.log("SocialLinks component rendering with creatorId:", creatorId, "links:", links);
  
  if (isLoading) {
    return <div className="text-muted-foreground text-sm">Loading links...</div>;
  }
  
  if (!links || links.length === 0) {
    return null;
  }
  
  const getIconForLink = (link: SocialLink) => {
    if (!link.label) return <Globe className="h-4 w-4" />;
    
    const label = link.label.toLowerCase();
    
    for (const [key, icon] of Object.entries(ICON_MAP)) {
      if (label.includes(key) || link.url.includes(key)) {
        return icon;
      }
    }
    
    if (link.url.includes("mailto:")) {
      return <AtSign className="h-4 w-4" />;
    }
    
    return <Globe className="h-4 w-4" />;
  };
  
  return (
    <div className={`flex gap-2 ${className}`}>
      {links.map((link) => (
        <Button
          key={link.id}
          variant={variant}
          size={size}
          asChild
          title={link.label || link.url}
          className="rounded-full"
        >
          <a href={link.url} target="_blank" rel="noopener noreferrer">
            {getIconForLink(link)}
            {size !== 'icon' && link.label && (
              <span className="ml-2">{link.label}</span>
            )}
          </a>
        </Button>
      ))}
    </div>
  );
}
