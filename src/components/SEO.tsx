import React, { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  robots?: string; // e.g., "noindex,nofollow" or "index,follow"
  canonicalUrl?: string;
}

const SEO: React.FC<SEOProps> = ({ title, description, robots, canonicalUrl }) => {
  useEffect(() => {
    const prevTitle = document.title;

    if (title) {
      document.title = title;
    }

    const setMeta = (name: string, content?: string) => {
      if (!content) return;
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const setCanonical = (href?: string) => {
      if (!href) return;
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', href);
    };

    if (description) setMeta('description', description);
    if (robots) setMeta('robots', robots);

    // Fallback canonical to current URL when not provided
    const canonical = canonicalUrl || (typeof window !== 'undefined' ? window.location.href : undefined);
    if (canonical) setCanonical(canonical);

    return () => {
      if (title) document.title = prevTitle;
    };
  }, [title, description, robots, canonicalUrl]);

  return null;
};

export default SEO;
