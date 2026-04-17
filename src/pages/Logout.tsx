
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { ShoppingBag, Users, Sparkles, LucideIcon } from "lucide-react";

function FeatureCard({ title, description, Icon }: { title: string; description: string; Icon: LucideIcon }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 text-center">
      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-semibold text-base mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}

export default function Logout() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">You've been logged out</CardTitle>
            <CardDescription className="text-lg">Thank you for using FanRealms</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-6">
            <div className="text-center max-w-xl mx-auto">
              <p className="text-muted-foreground mb-6">
                We hope to see you again soon. Continue discovering creators and assets on FanRealms.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild className="min-w-[150px]">
                  <Link to="/login">Log back in</Link>
                </Button>
                <Button asChild variant="outline" className="min-w-[150px]">
                  <Link to="/signup">Create account</Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-8">
              <FeatureCard
                title="Buy Digital Assets"
                description="Find tools, templates, and art from indie creators."
                Icon={ShoppingBag}
              />
              <FeatureCard
                title="Hire Creators"
                description="Post gigs or commission custom work directly."
                Icon={Users}
              />
              <FeatureCard
                title="Sell Your Work"
                description="Open a storefront and reach an indie audience."
                Icon={Sparkles}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border mt-6 pt-6">
            <div className="text-center text-sm text-muted-foreground">
              <p>© {new Date().getFullYear()} FanRealms. All rights reserved.</p>
              <div className="flex justify-center gap-4 mt-2">
                <Link to="/terms" className="text-primary hover:text-primary/80">Terms</Link>
                <Link to="/privacy" className="text-primary hover:text-primary/80">Privacy</Link>
                <Link to="/help" className="text-primary hover:text-primary/80">Help Center</Link>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
