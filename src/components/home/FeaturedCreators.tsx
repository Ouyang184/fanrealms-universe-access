
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Award, ChevronRight, Star } from "lucide-react";

interface Creator {
  id: number;
  name: string;
  username: string;
  description: string;
  subscribers: number;
  rating: number;
}

export function FeaturedCreators() {
  const featuredCreators: Creator[] = [
    {
      id: 1,
      name: "Digital Art Master",
      username: "artmaster",
      description: "Digital art and illustration tutorials for all skill levels",
      subscribers: 1000,
      rating: 4.7
    },
    {
      id: 2,
      name: "Game Development Pro",
      username: "gamedevpro",
      description: "Game development tutorials, assets, and behind-the-scenes content",
      subscribers: 2000,
      rating: 4.8
    },
    {
      id: 3,
      name: "Music Production Studio",
      username: "musicstudio",
      description: "Music production tutorials, sample packs, and exclusive tracks",
      subscribers: 3000,
      rating: 4.9
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
          <Card key={i} className="bg-gray-900 border-gray-800 overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-purple-900 to-blue-900" />
            <CardContent className="pt-0 -mt-12 p-6">
              <div className="flex justify-between items-start">
                <Avatar className="h-20 w-20 border-4 border-gray-900">
                  <AvatarImage src={`/placeholder.svg?height=80&width=80&text=${i + 1}`} />
                  <AvatarFallback className="bg-gray-800 text-xl">{creator.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <Badge className="mt-2 bg-purple-600 flex items-center gap-1">
                  <Award className="h-3 w-3" /> Featured
                </Badge>
              </div>
              <h3 className="text-xl font-bold mt-4">{creator.name}</h3>
              <p className="text-gray-400 text-sm mt-1">{creator.description}</p>

              <div className="flex items-center gap-2 mt-4">
                <Avatar className="h-6 w-6 border-2 border-gray-900">
                  <AvatarFallback className="bg-purple-900 text-xs">U1</AvatarFallback>
                </Avatar>
                <Avatar className="h-6 w-6 border-2 border-gray-900 -ml-2">
                  <AvatarFallback className="bg-blue-900 text-xs">U2</AvatarFallback>
                </Avatar>
                <Avatar className="h-6 w-6 border-2 border-gray-900 -ml-2">
                  <AvatarFallback className="bg-green-900 text-xs">U3</AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-400">+{creator.subscribers} subscribers</span>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">{creator.rating}/5.0</span>
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
