
export const isValidVideoUrl = (url: string): boolean => {
  if (!url) return true; // Empty URL is valid
  const videoUrlPatterns = [
    /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/,
    /^https?:\/\/(www\.)?vimeo\.com/,
    /^https?:\/\/(www\.)?dailymotion\.com/,
    /^https?:\/\/(www\.)?twitch\.tv/
  ];
  return videoUrlPatterns.some(pattern => pattern.test(url));
};
