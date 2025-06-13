
import React, { useState } from 'react';

interface PostCardContentProps {
  title: string;
  content: string;
}

export function PostCardContent({ title, content }: PostCardContentProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Define character limit for truncation
  const CHARACTER_LIMIT = 200;
  
  // Check if content needs truncation
  const needsTruncation = content.length > CHARACTER_LIMIT;
  
  // Get display content based on expansion state
  const displayContent = needsTruncation && !isExpanded 
    ? content.slice(0, CHARACTER_LIMIT)
    : content;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold leading-tight">{title}</h3>
      <div className="text-muted-foreground leading-relaxed">
        <span>{displayContent}</span>
        {needsTruncation && !isExpanded && (
          <>
            <span>...</span>
            <button
              onClick={() => setIsExpanded(true)}
              className="text-primary hover:underline ml-1 font-normal"
            >
              Read more
            </button>
          </>
        )}
        {needsTruncation && isExpanded && (
          <button
            onClick={() => setIsExpanded(false)}
            className="text-primary hover:underline ml-2 font-normal"
          >
            Show less
          </button>
        )}
      </div>
    </div>
  );
}
