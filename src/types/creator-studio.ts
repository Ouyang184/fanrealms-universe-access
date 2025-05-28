
export interface CreatorPost {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorAvatar?: string | null;
  createdAt: string;
  date: string;
  tier_id?: string | null;
  status: "published" | "scheduled" | "draft";
  tags?: string[];
  engagement?: {
    views: number;
    likes: number;
    comments: number;
  };
  availableTiers?: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  scheduleDate?: string;
  lastEdited: string;
  type: "article" | "image" | "video" | "audio";
  canView?: boolean;
  isLocked?: boolean;
}
