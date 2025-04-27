
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-fanrealms-light">
      <div className="container mx-auto px-4 py-16">
        <header className="flex justify-between items-center mb-16">
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
        </main>
      </div>
    </div>
  );
};

export default Home;
