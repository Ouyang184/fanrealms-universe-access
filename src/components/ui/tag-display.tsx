import React from 'react';
import { Hash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TagDisplayProps {
  tags: string[];
  onTagClick?: (tag: string) => void;
  maxTags?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'secondary' | 'outline';
}

export function TagDisplay({
  tags,
  onTagClick,
  maxTags,
  className,
  size = 'sm',
  variant = 'secondary'
}: TagDisplayProps) {
  if (!tags || tags.length === 0) return null;

  const displayTags = maxTags ? tags.slice(0, maxTags) : tags;
  const remainingCount = maxTags && tags.length > maxTags ? tags.length - maxTags : 0;

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {displayTags.map((tag) => (
        <Badge
          key={tag}
          variant={variant}
          className={cn(
            sizeClasses[size],
            onTagClick && "cursor-pointer hover:bg-primary/80 transition-colors"
          )}
          onClick={() => onTagClick?.(tag)}
        >
          <Hash className={cn(
            "mr-1",
            size === 'sm' && "w-2.5 h-2.5",
            size === 'md' && "w-3 h-3",
            size === 'lg' && "w-3.5 h-3.5"
          )} />
          {tag}
        </Badge>
      ))}
      
      {remainingCount > 0 && (
        <Badge variant="outline" className={sizeClasses[size]}>
          +{remainingCount} more
        </Badge>
      )}
    </div>
  );
}