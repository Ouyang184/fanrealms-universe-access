
// Generate gradient banners for posts without media content
export const generatePostBanner = (postTitle: string) => {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  ];
  
  // Use title to consistently pick the same gradient for the same post
  const hash = postTitle.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return gradients[Math.abs(hash) % gradients.length];
};

// Check if post has any media content (images, files, or embedded videos)
export const hasMediaContent = (attachments: any): boolean => {
  if (!attachments) return false;
  
  let parsedAttachments = [];
  
  // Parse attachments from various formats
  if (typeof attachments === 'string' && attachments !== "undefined") {
    try {
      parsedAttachments = JSON.parse(attachments);
    } catch {
      return false;
    }
  } else if (Array.isArray(attachments)) {
    parsedAttachments = attachments;
  } else if (attachments && typeof attachments === 'object' && attachments.value) {
    if (typeof attachments.value === 'string' && attachments.value !== "undefined") {
      try {
        parsedAttachments = JSON.parse(attachments.value);
      } catch {
        return false;
      }
    } else if (Array.isArray(attachments.value)) {
      parsedAttachments = attachments.value;
    }
  }
  
  // Check if there are any valid media attachments
  return Array.isArray(parsedAttachments) && parsedAttachments.length > 0;
};
