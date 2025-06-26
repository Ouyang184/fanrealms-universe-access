
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="mb-12">
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-purple-900 to-black h-64">
        <div className="absolute inset-0 z-20 flex flex-col justify-center p-8">
          <h1 className="text-4xl font-bold mb-2">Welcome to FanRealms</h1>
          <p className="text-xl text-gray-200 max-w-2xl mb-6">
            Support your favorite creators and get exclusive content, direct interaction, and special perks.
          </p>
          <div className="flex gap-4">
            <Link to="/explore">
              <Button className="bg-purple-600 hover:bg-purple-700">Discover Creators</Button>
            </Link>
            <Button variant="outline" className="border-white/30 hover:bg-white/10" asChild>
              <Link to="/onboarding">Become a Creator</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
