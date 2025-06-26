
import { Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useCreators } from "@/hooks/useCreators";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";

interface CreatorListProps {
  selectedCreators: number[];
  onToggle: (id: number) => void;
  selectedCategories: number[];
}

// Map category IDs to category names for matching with creator tags
const getCategoryNames = (categoryIds: number[]) => {
  const categories = [
    { id: 1, name: "Art & Illustration", tags: ["art", "illustration", "digital art", "drawing"] },
    { id: 2, name: "Gaming", tags: ["gaming", "games", "game development", "esports"] },
    { id: 3, name: "Music", tags: ["music", "audio", "sound", "beats"] },
    { id: 4, name: "Writing", tags: ["writing", "creative writing", "stories", "books"] },
    { id: 5, name: "Photography", tags: ["photography", "photos", "camera", "visual"] },
    { id: 6, name: "Education", tags: ["education", "teaching", "learning", "tutorial"] },
    { id: 7, name: "Podcasts", tags: ["podcast", "audio", "talk", "interview"] },
    { id: 8, name: "Cooking", tags: ["cooking", "food", "recipes", "chef"] },
    { id: 9, name: "Fitness", tags: ["fitness", "workout", "health", "exercise"] },
    { id: 10, name: "Technology", tags: ["technology", "tech", "programming", "coding"] },
    { id: 11, name: "Fashion", tags: ["fashion", "style", "clothing", "design"] },
    { id: 12, name: "Film & Video", tags: ["film", "video", "cinema", "movies"] },
  ];
  
  return categoryIds
    .map(id => categories.find(cat => cat.id === id))
    .filter(Boolean)
    .flatMap(cat => cat!.tags);
};

export function CreatorList({ selectedCreators, onToggle, selectedCategories }: CreatorListProps) {
  const { data: allCreators = [], isLoading } = useCreators();

  // Filter and sort creators based on user preferences
  const filteredCreators = useMemo(() => {
    if (!allCreators.length) return [];

    const preferredTags = getCategoryNames(selectedCategories);
    
    if (preferredTags.length === 0) {
      // If no preferences selected, show all creators
      return allCreators.slice(0, 6);
    }

    // Score creators based on tag matches
    const scoredCreators = allCreators.map(creator => {
      const creatorTags = creator.tags || [];
      let score = 0;
      
      preferredTags.forEach(prefTag => {
        creatorTags.forEach(creatorTag => {
          if (creatorTag.toLowerCase().includes(prefTag.toLowerCase()) ||
              prefTag.toLowerCase().includes(creatorTag.toLowerCase())) {
            score += 1;
          }
        });
      });
      
      return { ...creator, matchScore: score };
    });

    // Sort by match score (highest first) and take top 6
    const sortedCreators = scoredCreators
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 6);

    // If no good matches found, show random creators
    if (sortedCreators.every(creator => creator.matchScore === 0)) {
      return allCreators.slice(0, 6);
    }

    return sortedCreators;
  }, [allCreators, selectedCategories]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 rounded-lg border bg-gray-800 border-gray-700 flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-3 w-full mt-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!filteredCreators.length) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>No creators found. Please try different preferences or check back later.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {filteredCreators.map((creator) => {
        // Use a numeric ID based on the creator's database ID for selection tracking
        const numericId = parseInt(creator.id.replace(/-/g, '').substring(0, 8), 16);
        const isSelected = selectedCreators.includes(numericId);
        const displayName = creator.displayName || creator.display_name || creator.username || "Creator";
        
        return (
          <div
            key={creator.id}
            className={`
              relative p-4 rounded-lg border cursor-pointer transition-all flex items-center gap-4
              ${
                isSelected
                  ? "bg-purple-900/30 border-purple-500"
                  : "bg-gray-800 border-gray-700 hover:border-gray-600"
              }
            `}
            onClick={() => onToggle(numericId)}
          >
            {isSelected && (
              <div className="absolute top-2 right-2 bg-purple-500 rounded-full p-0.5">
                <Check className="h-3 w-3" />
              </div>
            )}
            <Avatar className="h-12 w-12">
              <AvatarImage src={creator.avatar_url || creator.profile_image_url || ''} alt={displayName} />
              <AvatarFallback className="bg-purple-900">{displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{displayName}</h4>
                <Badge variant="outline" className="bg-gray-700 border-gray-600 text-xs">
                  {creator.follower_count || 0} followers
                </Badge>
              </div>
              <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                {creator.bio || "Creator on FanRealms"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
