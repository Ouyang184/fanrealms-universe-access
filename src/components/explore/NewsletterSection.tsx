
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

export function NewsletterSection() {
  return (
    <section>
      <Card className="bg-purple-900/30 border-purple-800">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">Stay Updated</h2>
              <p className="text-gray-300 mb-6">
                Subscribe to our newsletter to get weekly updates on new creators, trending content, and exclusive
                offers.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Enter your email"
                  className="bg-gray-900/80 border-gray-700 focus-visible:ring-purple-500"
                />
                <Button className="bg-purple-600 hover:bg-purple-700 whitespace-nowrap">Subscribe</Button>
              </div>
            </div>
            <div className="flex-shrink-0 hidden md:block">
              <Bell className="h-20 w-20 text-purple-400 opacity-80" />
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
