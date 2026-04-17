
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

export function NewsletterSection() {
  return (
    <section>
      <Card className="bg-primary/10 border-primary/20">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">Stay Updated</h2>
              <p className="text-muted-foreground mb-6">
                Subscribe to our newsletter to get weekly updates on new creators, trending content, and exclusive
                offers.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Enter your email"
                  className="bg-card/80 border-border focus-visible:ring-primary"
                />
                <Button className="bg-primary hover:bg-primary/90 whitespace-nowrap">Subscribe</Button>
              </div>
            </div>
            <div className="flex-shrink-0 hidden md:block">
              <Bell className="h-20 w-20 text-primary opacity-80" />
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
