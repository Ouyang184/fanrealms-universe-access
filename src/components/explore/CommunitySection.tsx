
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function CommunitySection() {
  return (
    <section className="mb-10">
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-4">Join Our Creator Community</h2>
              <p className="text-gray-300 mb-6">
                Start sharing your passion and expertise with subscribers around the world. Build your audience and
                earn from your content on FanRealms.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button className="bg-purple-600 hover:bg-purple-700" asChild>
                  <Link to="/complete-profile">Become a Creator</Link>
                </Button>
                <Button variant="outline">Learn More</Button>
              </div>
            </div>
            <div className="flex-shrink-0">
              <img
                src="/placeholder.svg?height=200&width=200&text=Creator+Community"
                alt="Creator Community"
                className="rounded-lg"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
