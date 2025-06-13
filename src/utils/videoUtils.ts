
export interface VideoInfo {
  platform: 'youtube' | 'vimeo' | 'dailymotion' | 'twitch' | 'unknown';
  videoId: string;
  embedUrl: string;
  thumbnailUrl?: string;
}

export function parseVideoUrl(url: string): VideoInfo | null {
  if (!url) return null;

  // YouTube patterns
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const youtubeMatch = url.match(youtubeRegex);
  if (youtubeMatch) {
    const videoId = youtubeMatch[1];
    return {
      platform: 'youtube',
      videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    };
  }

  // Vimeo patterns
  const vimeoRegex = /vimeo\.com\/(?:.*\/)?(\d+)/;
  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch) {
    const videoId = vimeoMatch[1];
    return {
      platform: 'vimeo',
      videoId,
      embedUrl: `https://player.vimeo.com/video/${videoId}`,
    };
  }

  // Dailymotion patterns
  const dailymotionRegex = /dailymotion\.com\/video\/([a-zA-Z0-9]+)/;
  const dailymotionMatch = url.match(dailymotionRegex);
  if (dailymotionMatch) {
    const videoId = dailymotionMatch[1];
    return {
      platform: 'dailymotion',
      videoId,
      embedUrl: `https://www.dailymotion.com/embed/video/${videoId}`,
    };
  }

  // Twitch patterns
  const twitchRegex = /twitch\.tv\/videos\/(\d+)/;
  const twitchMatch = url.match(twitchRegex);
  if (twitchMatch) {
    const videoId = twitchMatch[1];
    return {
      platform: 'twitch',
      videoId,
      embedUrl: `https://player.twitch.tv/?video=${videoId}&parent=${window.location.hostname}`,
    };
  }

  return {
    platform: 'unknown',
    videoId: '',
    embedUrl: url,
  };
}

export function isVideoUrl(url: string): boolean {
  if (!url) return false;
  
  // Check for video platform URLs using a comprehensive regex
  const videoUrlRegex = /(?:youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|twitch\.tv)/i;
  return videoUrlRegex.test(url);
}
