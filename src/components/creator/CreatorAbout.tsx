
import React from "react";
import { CreatorProfile } from "@/types";

interface CreatorAboutProps {
  creator: CreatorProfile;
}

// Helper function to parse and render rich content
const renderRichContent = (content: string) => {
  if (!content) return "No information provided.";
  
  // Split content by lines to handle different media types
  const lines = content.split('\n');
  
  return lines.map((line, index) => {
    const trimmedLine = line.trim();
    
    // Check if line contains an image URL
    const imageMatch = trimmedLine.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) {
      const [, altText, imageUrl] = imageMatch;
      return (
        <div key={index} className="my-4">
          <img 
            src={imageUrl} 
            alt={altText || "Embedded image"} 
            className="max-w-full h-auto rounded-lg shadow-md mx-auto"
            loading="lazy"
          />
        </div>
      );
    }
    
    // Check if line contains a video URL (YouTube, Vimeo, etc.)
    const videoMatch = trimmedLine.match(/^@\[([^\]]*)\]\(([^)]+)\)$/);
    if (videoMatch) {
      const [, title, videoUrl] = videoMatch;
      
      // Handle YouTube URLs
      if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        let videoId = '';
        if (videoUrl.includes('youtu.be/')) {
          videoId = videoUrl.split('youtu.be/')[1].split('?')[0];
        } else if (videoUrl.includes('youtube.com/watch?v=')) {
          videoId = videoUrl.split('v=')[1].split('&')[0];
        }
        
        if (videoId) {
          return (
            <div key={index} className="my-4">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' /* 16:9 aspect ratio */ }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title={title || "Embedded video"}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          );
        }
      }
      
      // Handle Vimeo URLs
      if (videoUrl.includes('vimeo.com')) {
        const videoId = videoUrl.split('vimeo.com/')[1]?.split('?')[0];
        if (videoId) {
          return (
            <div key={index} className="my-4">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                  src={`https://player.vimeo.com/video/${videoId}`}
                  title={title || "Embedded video"}
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          );
        }
      }
      
      // Fallback for other video URLs
      return (
        <div key={index} className="my-4">
          <video 
            controls 
            className="max-w-full h-auto rounded-lg shadow-md mx-auto"
            preload="metadata"
          >
            <source src={videoUrl} />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }
    
    // Regular text content
    if (trimmedLine) {
      return (
        <p key={index} className="text-muted-foreground mb-2">
          {trimmedLine}
        </p>
      );
    }
    
    // Empty line
    return <br key={index} />;
  });
};

export function CreatorAbout({ creator }: CreatorAboutProps) {
  const displayName = creator.displayName || creator.display_name || creator.fullName || creator.username || "Creator";
  
  return (
    <div className="max-w-3xl mx-auto prose prose-sm">
      <h3 className="text-xl font-semibold mb-4">About {displayName}</h3>
      <div className="space-y-2">
        {renderRichContent(creator.bio || "")}
      </div>
    </div>
  );
}
