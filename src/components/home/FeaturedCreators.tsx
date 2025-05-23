
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Award, ChevronRight } from "lucide-react";
import { CreatorProfile } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

interface FeaturedCreatorsProps {
  creators?: CreatorProfile[];
  isLoading?: boolean;
}

export function FeaturedCreators({ creators = [], isLoading = false }: FeaturedCreatorsProps) {
  if (isLoading) {
    return (
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Featured Creators</h2>
          <Button variant="link" className="text-purple-400">
            View All <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="bg-gray-900 border-gray-800 overflow-hidden">
              <Skeleton className="h-32 w-full" />
              <CardContent className="pt-0 -mt-12 p-6">
                <div className="flex justify-between items-start">
                  <Skeleton className="h-20 w-20 rounded-md" />
                  <Skeleton className="h-6 w-24 mt-2" />
                </div>
                <Skeleton className="h-6 w-3/4 mt-4" />
                <Skeleton className="h-4 w-full mt-1" />
                <div className="mt-6 flex items-center justify-between">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  // If no creators, show the static data
  const featuredCreators = creators.length > 0 ? creators : [
    {
      id: "1",
      user_id: "1",
      username: "Digital Art Master",
      displayName: "Digital Art Master",
      bio: "Digital art and illustration tutorials for all skill levels",
      avatar_url: `/placeholder.svg?height=80&width=80&text=1`
    },
    {
      id: "2",
      user_id: "2",
      username: "Game Development Pro",
      displayName: "Game Development Pro",
      bio: "Game development tutorials, assets, and behind-the-scenes content",
      avatar_url: `/placeholder.svg?height=80&width=80&text=2`
    },
    {
      id: "3",
      user_id: "3",
      username: "Music Production Studio",
      displayName: "Music Production Studio",
      bio: "Music production tutorials, sample packs, and exclusive tracks",
      avatar_url: `/placeholder.svg?height=80&width=80&text=3`
    }
  ];

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Featured Creators</h2>
        <Button variant="link" className="text-purple-400">
          View All <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuredCreators.map((creator, i) => (
          <Card key={creator.id} className="bg-gray-900 border-gray-800 overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-purple-900 to-blue-900" />
            <CardContent className="pt-0 -mt-12 p-6">
              <div className="flex justify-between items-start">
                <Avatar className="h-20 w-20 border-4 border-gray-900">
                  <AvatarImage src={creator.avatar_url || `/placeholder.svg?height=80&width=80&text=${i + 1}`} />
                  <AvatarFallback className="bg-gray-800 text-xl">{(creator.displayName || creator.username || "").substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <Badge className="mt-2 bg-purple-600 flex items-center gap-1">
                  <Award className="h-3 w-3" /> Featured
                </Badge>
              </div>
              <h3 className="text-xl font-bold mt-4">{creator.displayName || creator.username}</h3>
              <p className="text-gray-400 text-sm mt-1">{creator.bio || "Creator on FanRealms"}</p>

              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  From <span className="font-medium">${(9.99).toFixed(2)}/mo</span>
                </div>
                <Link to={`/creator/${creator.id}`}>
                  <Button className="bg-purple-600 hover:bg-purple-700">Visit Page</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
