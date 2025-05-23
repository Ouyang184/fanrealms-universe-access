
import { Link } from "react-router-dom";
import { Card, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export function DiscoverSection() {
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Discover More</h2>
        <Button variant="link" className="text-purple-400">
          View All <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

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
            <Button className="w-full bg-purple-600 hover:bg-purple-700">Explore Top Rated</Button>
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
            <Button className="w-full bg-purple-600 hover:bg-purple-700">Discover New Talent</Button>
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
            <Button className="w-full bg-purple-600 hover:bg-purple-700">Browse Free Content</Button>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
