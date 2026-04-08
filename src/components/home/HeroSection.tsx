
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
    <section className="py-16 sm:py-24">
      <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight max-w-2xl">
        The indie marketplace for creators and makers.
      </h1>
      <p className="text-muted-foreground text-lg sm:text-xl mt-4 max-w-xl">
        Showcase projects, sell digital products, find gigs, and connect with a community of builders.
      </p>
      <div className="flex gap-3 mt-8">
        <Link to="/explore">
          <Button size="lg">Browse Projects</Button>
        </Link>
        <Button
          variant="ghost"
          size="lg"
          onClick={handleBecomeCreatorClick}
        >
          Start creating →
        </Button>
      </div>
    </section>
  );
}
