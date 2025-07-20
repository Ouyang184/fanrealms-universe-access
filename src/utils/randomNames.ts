// Random name generator for users without usernames

const adjectives = [
  'Amazing', 'Brilliant', 'Creative', 'Dynamic', 'Energetic', 'Fantastic',
  'Graceful', 'Happy', 'Incredible', 'Joyful', 'Kind', 'Lovely', 'Marvelous',
  'Nice', 'Outstanding', 'Perfect', 'Quirky', 'Radiant', 'Stunning', 'Talented',
  'Unique', 'Vibrant', 'Wonderful', 'Excellent', 'Youthful', 'Zealous',
  'Brave', 'Clever', 'Daring', 'Epic', 'Fierce', 'Glorious', 'Heroic',
  'Inspiring', 'Legendary', 'Mighty', 'Noble', 'Powerful', 'Royal', 'Swift'
];

const nouns = [
  'Artist', 'Creator', 'Builder', 'Designer', 'Explorer', 'Finder', 'Guardian',
  'Helper', 'Innovator', 'Joker', 'Keeper', 'Leader', 'Maker', 'Navigator',
  'Observer', 'Pioneer', 'Questor', 'Runner', 'Seeker', 'Traveler', 'User',
  'Visitor', 'Wanderer', 'Writer', 'Dreamer', 'Thinker', 'Adventurer',
  'Champion', 'Genius', 'Hero', 'Legend', 'Master', 'Ninja', 'Phoenix',
  'Rebel', 'Sage', 'Warrior', 'Wizard', 'Star', 'Storm', 'Wave'
];

/**
 * Generates a random display name for users without usernames
 * @param seed Optional seed for consistent generation (e.g., user ID)
 * @returns A random name in format "AdjectiveNoun123"
 */
export function generateRandomDisplayName(seed?: string): string {
  // Use seed for consistent generation or current time for randomness
  const seedValue = seed ? hashString(seed) : Date.now();
  
  const adjIndex = Math.abs(seedValue) % adjectives.length;
  const nounIndex = Math.abs(seedValue * 7) % nouns.length;
  const number = Math.abs(seedValue * 13) % 1000;
  
  return `${adjectives[adjIndex]}${nouns[nounIndex]}${number}`;
}

/**
 * Simple hash function to convert string to number
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
}

/**
 * Gets a display name for a user, falling back to random generation if needed
 * @param user User object with potential username, display_name, email, id
 * @returns A suitable display name
 */
export function getDisplayName(user: {
  username?: string | null;
  display_name?: string | null;
  displayName?: string | null;
  email?: string;
  id?: string;
}): string {
  // Priority order: display_name -> username -> email prefix -> random name
  if (user.display_name) return user.display_name;
  if (user.displayName) return user.displayName;
  if (user.username) return user.username;
  if (user.email) {
    const emailPrefix = user.email.split('@')[0];
    // If email prefix looks meaningful (not just numbers/random), use it
    if (emailPrefix.length > 3 && !/^\d+$/.test(emailPrefix)) {
      return emailPrefix;
    }
  }
  
  // Fall back to random name generation using user ID as seed for consistency
  return generateRandomDisplayName(user.id);
}

/**
 * Gets initials for avatar display
 */
export function getInitials(displayName: string): string {
  return displayName
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
}