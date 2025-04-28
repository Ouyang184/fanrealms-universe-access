
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import Footer from "@/components/Layout/Footer";

const Home = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="container mx-auto px-4">
        <header className="flex justify-between items-center h-16">
          <h1 className="text-2xl font-bold gradient-text">FanRealms</h1>
          <div className="flex gap-4">
            {user ? (
              <Button asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline">
                  <Link to="/login">Log In</Link>
                </Button>
                <Button asChild>
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </header>
        
        <main className="flex flex-col items-center text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Connect with your favorite <span className="gradient-text">creators</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mb-10">
            FanRealms helps creators build exclusive communities and deliver premium content to their most dedicated fans.
          </p>
          <div className="flex gap-4">
            {user ? (
              <Button size="lg" asChild>
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <Button size="lg" asChild>
                <Link to="/signup">Get Started</Link>
              </Button>
            )}
          </div>
          
          <div className="mt-20 w-full max-w-4xl">
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-primary/30 rounded-xl blur-xl opacity-75"></div>
              <div className="relative bg-card rounded-lg overflow-hidden border border-border">
                <div className="p-1">
                  <img 
                    src="https://picsum.photos/seed/dashboard/1200/600" 
                    alt="FanRealms Platform Preview" 
                    className="rounded-lg shadow-xl w-full"
                  />
                </div>
              </div>
            </div>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-card rounded-xl border border-border">
                <h3 className="text-xl font-semibold mb-2">Connect with Fans</h3>
                <p className="text-muted-foreground">Build a dedicated community around your content and engage directly with your audience.</p>
              </div>
              <div className="p-6 bg-card rounded-xl border border-border">
                <h3 className="text-xl font-semibold mb-2">Monetize Your Work</h3>
                <p className="text-muted-foreground">Offer premium content, memberships, and exclusive perks to support your creative journey.</p>
              </div>
              <div className="p-6 bg-card rounded-xl border border-border">
                <h3 className="text-xl font-semibold mb-2">Grow Your Audience</h3>
                <p className="text-muted-foreground">Reach new fans and build your brand with powerful discovery and promotion tools.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
      {/* Only show footer when user is not authenticated */}
      {!user && <Footer />}
    </div>
  );
};

export default Home;
