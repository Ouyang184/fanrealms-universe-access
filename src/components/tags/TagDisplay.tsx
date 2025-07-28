import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Hash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TagDisplayProps {
  tags: string[];
  className?: string;
  maxTags?: number;
  clickable?: boolean;
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'sm' | 'default';
}

export function TagDisplay({ 
  tags, 
  className = "", 
  maxTags, 
  clickable = true,
  variant = "secondary",
  size = "default"
}: TagDisplayProps) {
  const navigate = useNavigate();

  if (!tags || tags.length === 0) return null;

  const displayTags = maxTags ? tags.slice(0, maxTags) : tags;
  const remainingCount = maxTags && tags.length > maxTags ? tags.length - maxTags : 0;

  const handleTagClick = (tag: string) => {
    if (clickable) {
      // Navigate to search/explore page with tag filter
      navigate(`/explore?tag=${encodeURIComponent(tag)}`);
    }
  };

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {displayTags.map((tag) => (
        <Badge 
          key={tag}
          variant={variant}
          className={`
            ${size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'}
            ${clickable ? 'cursor-pointer hover:bg-primary/20 hover:text-primary transition-colors' : ''}
            bg-primary/10 text-primary border-primary/20
          `}
          onClick={() => handleTagClick(tag)}
        >
          <Hash className={`${size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'} mr-1`} />
          {tag}
        </Badge>
      ))}
      
      {remainingCount > 0 && (
        <Badge 
          variant="outline" 
          className={`
            ${size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'}
            text-muted-foreground border-muted-foreground/30
          `}
        >
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
}