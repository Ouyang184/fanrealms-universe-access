
// Post banner utility functions
export const gradientBanners = [
  'bg-gradient-to-br from-purple-600 via-purple-700 to-blue-800',
  'bg-gradient-to-br from-blue-600 via-purple-600 to-pink-700',
  'bg-gradient-to-br from-indigo-600 via-blue-700 to-purple-800',
  'bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-700',
  'bg-gradient-to-br from-purple-700 via-indigo-600 to-blue-700',
  'bg-gradient-to-br from-blue-700 via-indigo-600 to-purple-600',
  'bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-600',
  'bg-gradient-to-br from-purple-800 via-blue-700 to-indigo-600',
];

export const generatePostBanner = (postId: string): string => {
  // Use post ID to consistently generate the same banner for each post
  const hash = postId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  const index = Math.abs(hash) % gradientBanners.length;
  return gradientBanners[index];
};
