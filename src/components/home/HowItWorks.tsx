
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Search, Zap } from "lucide-react";

export function HowItWorks() {
  return (
    <section className="mb-12">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-2xl">How FanRealms Works</CardTitle>
          <CardDescription>Support creators you love and get exclusive content and perks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-purple-900/30 flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">Discover Creators</h3>
              <p className="text-gray-400 text-sm">
                Find creators that match your interests across various categories and niches
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-purple-900/30 flex items-center justify-center mb-4">
                <Award className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">Choose Your Tier</h3>
              <p className="text-gray-400 text-sm">
                Select a subscription tier that fits your budget and desired level of access
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-purple-900/30 flex items-center justify-center mb-4">
                <Zap className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">Enjoy Benefits</h3>
              <p className="text-gray-400 text-sm">
                Get exclusive content, direct interaction with creators, and special perks
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button className="bg-purple-600 hover:bg-purple-700">Get Started</Button>
        </CardFooter>
      </Card>
    </section>
  );
}
