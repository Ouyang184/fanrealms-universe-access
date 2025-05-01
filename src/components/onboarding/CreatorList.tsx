
import { Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// Sample creators for onboarding
const recommendedCreators = [
  {
    id: 1,
    name: "Digital Art Master",
    username: "artmaster",
    avatar: "/placeholder.svg",
    description: "Digital art and illustration tutorials",
    subscribers: 12500,
    selected: false,
  },
  {
    id: 2,
    name: "Game Development Pro",
    username: "gamedevpro",
    avatar: "/placeholder.svg",
    description: "Game development tutorials and assets",
    subscribers: 8700,
    selected: false,
  },
  {
    id: 3,
    name: "Music Production Studio",
    username: "musicstudio",
    avatar: "/placeholder.svg",
    description: "Music production tutorials and sample packs",
    subscribers: 15300,
    selected: false,
  },
  {
    id: 4,
    name: "Writing Workshop",
    username: "writingworkshop",
    avatar: "/placeholder.svg",
    description: "Creative writing courses and feedback",
    subscribers: 6200,
    selected: false,
  },
  {
    id: 5,
    name: "Photo Masters",
    username: "photomasters",
    avatar: "/placeholder.svg",
    description: "Photography tutorials and presets",
    subscribers: 9400,
    selected: false,
  },
  {
    id: 6,
    name: "Cooking King",
    username: "cookingking",
    avatar: "/placeholder.svg",
    description: "Gourmet recipes and cooking techniques",
    subscribers: 11800,
    selected: false,
  },
];

interface CreatorListProps {
  selectedCreators: number[];
  onToggle: (id: number) => void;
}

export function CreatorList({ selectedCreators, onToggle }: CreatorListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {recommendedCreators.map((creator) => (
        <div
          key={creator.id}
          className={`
            relative p-4 rounded-lg border cursor-pointer transition-all flex items-center gap-4
            ${
              selectedCreators.includes(creator.id)
                ? "bg-purple-900/30 border-purple-500"
                : "bg-gray-800 border-gray-700 hover:border-gray-600"
            }
          `}
          onClick={() => onToggle(creator.id)}
        >
          {selectedCreators.includes(creator.id) && (
            <div className="absolute top-2 right-2 bg-purple-500 rounded-full p-0.5">
              <Check className="h-3 w-3" />
            </div>
          )}
          <Avatar className="h-12 w-12">
            <AvatarImage src={creator.avatar} alt={creator.name} />
            <AvatarFallback className="bg-purple-900">{creator.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{creator.name}</h4>
              <Badge variant="outline" className="bg-gray-700 border-gray-600 text-xs">
                {creator.subscribers.toLocaleString()} subscribers
              </Badge>
            </div>
            <p className="text-sm text-gray-400 mt-1">{creator.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
