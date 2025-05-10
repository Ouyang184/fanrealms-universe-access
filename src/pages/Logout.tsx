
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/Logo";

function FeatureCard({ title, description, emoji }: { title: string; description: string; emoji: string }) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 text-center">
      <div className="text-3xl mb-3">{emoji}</div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}

export default function Logout() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        <Card className="bg-gray-900 border-gray-800 text-white">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">You've been logged out</CardTitle>
            <CardDescription className="text-gray-400 text-lg">Thank you for using FanRealms</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-6">
            <div className="text-center max-w-xl mx-auto">
              <p className="text-gray-300 mb-6">
                We hope to see you again soon. Continue discovering and supporting your favorite creators on FanRealms.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild className="bg-purple-600 hover:bg-purple-700 min-w-[150px]">
                  <Link to="/login">Log back in</Link>
                </Button>
                <Button asChild variant="outline" className="border-gray-700 hover:bg-gray-800 min-w-[150px]">
                  <Link to="/signup">Create account</Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-8">
              <FeatureCard
                title="Support Creators"
                description="Subscribe to your favorite creators and get exclusive content."
                emoji="🎨"
              />
              <FeatureCard
                title="Join Communities"
                description="Connect with like-minded fans in creator communities."
                emoji="👥"
              />
              <FeatureCard
                title="Exclusive Content"
                description="Access premium content not available anywhere else."
                emoji="✨"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-gray-800 mt-6 pt-6">
            <div className="text-center text-sm text-gray-500">
              <p>© {new Date().getFullYear()} FanRealms. All rights reserved.</p>
              <div className="flex justify-center gap-4 mt-2">
                <Link to="/terms" className="text-purple-400 hover:text-purple-300">
                  Terms
                </Link>
                <Link to="/privacy" className="text-purple-400 hover:text-purple-300">
                  Privacy
                </Link>
                <Link to="/help" className="text-purple-400 hover:text-purple-300">
                  Help Center
                </Link>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
