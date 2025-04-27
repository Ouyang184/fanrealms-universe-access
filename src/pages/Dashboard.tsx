
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User } from "lucide-react";

const Dashboard = () => {
  const { user, profile, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-fanrealms-light">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold gradient-text">FanRealms</h1>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {isSigningOut ? "Signing out..." : "Sign Out"}
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span>Your Profile</span>
                </CardTitle>
                <CardDescription>Your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <div className="h-24 w-24 rounded-full bg-gradient-to-br from-fanrealms-purple to-fanrealms-blue flex items-center justify-center text-white text-2xl font-bold">
                    {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                  </div>
                </div>
                <div className="pt-2">
                  <h3 className="font-medium">{profile?.full_name}</h3>
                  <p className="text-sm text-muted-foreground">@{profile?.username}</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Email</span>
                    <span className="font-medium">{user?.email}</span>
                  </div>
                  {profile?.website && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Website</span>
                      <a 
                        href={profile.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline"
                      >
                        {profile.website.replace(/(^\w+:|^)\/\//, '')}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <User className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Welcome to FanRealms!</CardTitle>
                <CardDescription>
                  Your dashboard is ready to go. You can now start exploring the platform.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-accent p-4 rounded-md">
                  <p>This is where the main content of your application will be displayed. 
                  From here, you can navigate to different sections of the platform.</p>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">Need help? Contact our support team.</p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
