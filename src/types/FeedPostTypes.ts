
// Type definitions for feed posts

export interface Creator {
  id: number;
  name: string;
  username: string;
  avatar: string;
  tier: {
    name: string;
    color: string;
  };
}

// Define base content and specific content types
export interface BaseContent {
  title: string;
  description: string;
  thumbnail?: string;
  type: string;
  preview: boolean;
}

export interface VideoContent extends BaseContent {
  type: "video";
  duration: string;
}

export interface TutorialContent extends BaseContent {
  type: "tutorial";
  duration: string;
}

export interface DownloadContent extends BaseContent {
  type: "download";
  fileSize: string;
}

export interface PostContent extends BaseContent {
  type: "post";
  images?: string[];
}

export interface CourseContent extends BaseContent {
  type: "course";
  lessons: number;
  duration: string;
}

export interface EventContent extends BaseContent {
  type: "event";
  date: string;
}

export interface WorkshopContent extends BaseContent {
  type: "workshop";
  duration: string;
}

export type ContentType = VideoContent | TutorialContent | DownloadContent | PostContent | CourseContent | EventContent | WorkshopContent;

export interface FeedPost {
  id: number;
  creator: Creator;
  content: ContentType;
  metadata: {
    posted: string;
    views?: number;
    downloads?: number;
    likes: number;
    comments: number;
    isNew?: boolean;
    interested?: number;
  };
}
