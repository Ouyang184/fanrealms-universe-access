
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function HeroSection() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleBecomeCreatorClick = () => {
    if (!user) {
      const returnTo = encodeURIComponent('/complete-profile');
      navigate(`/login?returnTo=${returnTo}`);
      return;
    }
    navigate('/complete-profile');
  };

  return (
    <section className="mb-8 sm:mb-12">
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-purple-900 to-black h-56 sm:h-64">
        <div className="absolute inset-0 z-20 flex flex-col justify-center p-4 sm:p-8">
          <h1 className="text-2xl sm:text-4xl font-bold mb-2 leading-tight">Welcome to FanRealms</h1>
          <p className="text-sm sm:text-xl text-gray-200 max-w-2xl mb-4 sm:mb-6 leading-relaxed">
            Support your favorite creators and get exclusive content, direct interaction, and special perks.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link to="/explore">
              <Button className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto">Discover Creators</Button>
            </Link>
            <Button 
              variant="outline" 
              className="border-white/30 hover:bg-white/10 w-full sm:w-auto"
              onClick={handleBecomeCreatorClick}
            >
              Become a Creator
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
