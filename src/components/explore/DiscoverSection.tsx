
import { Link } from "react-router-dom";
import { Card, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { useCreators } from "@/hooks/useCreators";

export function DiscoverSection() {
  // Check if creators exist
  const { data: creators = [] } = useCreators();
  const hasCreators = creators.length > 0;
  
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Discover More</h2>
        <Button variant="link" className="text-purple-400">
          View All <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {hasCreators ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gray-900 border-gray-800 overflow-hidden">
            <div className="relative">
              <img
                src="/placeholder.svg?height=200&width=400&text=Top+Rated"
                alt="Top Rated Creators"
                className="w-full h-40 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                <div>
                  <h3 className="text-xl font-bold">Top Rated Creators</h3>
                  <p className="text-sm text-gray-300 mt-1">Discover the highest rated creators on FanRealms</p>
                </div>
              </div>
            </div>
            <CardFooter className="p-4">
              <Button className="w-full bg-purple-600 hover:bg-purple-700" asChild>
                <Link to="/explore?category=top">Explore Top Rated</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-gray-900 border-gray-800 overflow-hidden">
            <div className="relative">
              <img
                src="/placeholder.svg?height=200&width=400&text=New+Creators"
                alt="New Creators"
                className="w-full h-40 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                <div>
                  <h3 className="text-xl font-bold">New Creators</h3>
                  <p className="text-sm text-gray-300 mt-1">Support creators who are just getting started</p>
                </div>
              </div>
            </div>
            <CardFooter className="p-4">
              <Button className="w-full bg-purple-600 hover:bg-purple-700" asChild>
                <Link to="/explore?category=new">Discover New Talent</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-gray-900 border-gray-800 overflow-hidden">
            <div className="relative">
              <img
                src="/placeholder.svg?height=200&width=400&text=Free+Content"
                alt="Free Content"
                className="w-full h-40 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                <div>
                  <h3 className="text-xl font-bold">Free Content</h3>
                  <p className="text-sm text-gray-300 mt-1">Explore free content from various creators</p>
                </div>
              </div>
            </div>
            <CardFooter className="p-4">
              <Button className="w-full bg-purple-600 hover:bg-purple-700" asChild>
                <Link to="/explore?category=free">Browse Free Content</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-900 border border-gray-800 rounded-lg">
          <h3 className="text-xl font-bold mb-2">No Creators Yet</h3>
          <p className="text-gray-400 mb-4">Be the first to create content on FanRealms!</p>
          <Button className="bg-purple-600 hover:bg-purple-700" asChild>
            <Link to="/creator-studio/settings">Become a Creator</Link>
          </Button>
        </div>
      )}
    </section>
  );
}
