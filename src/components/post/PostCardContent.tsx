
import React from 'react';

interface PostCardContentProps {
  title: string;
  content: string;
}

export function PostCardContent({ title, content }: PostCardContentProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold leading-tight">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{content}</p>
    </div>
  );
}
