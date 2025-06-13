
import { useEffect, useRef, useCallback } from 'react';

interface UsePostVisibilityProps {
  postId: string;
  onPostSeen: (postId: string) => void;
  threshold?: number;
  visibilityDuration?: number;
}

export const usePostVisibility = ({ 
  postId, 
  onPostSeen, 
  threshold = 0.5, 
  visibilityDuration = 2000 
}: UsePostVisibilityProps) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasBeenSeenRef = useRef(false);

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    
    if (entry.isIntersecting && !hasBeenSeenRef.current) {
      // Post is visible, start the timer
      timeoutRef.current = setTimeout(() => {
        if (!hasBeenSeenRef.current) {
          hasBeenSeenRef.current = true;
          onPostSeen(postId);
          console.log(`Post ${postId} marked as seen after ${visibilityDuration}ms of visibility`);
        }
      }, visibilityDuration);
    } else if (!entry.isIntersecting && timeoutRef.current) {
      // Post is no longer visible, clear the timer
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [postId, onPostSeen, visibilityDuration]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin: '0px'
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handleIntersection, threshold]);

  return elementRef;
};
