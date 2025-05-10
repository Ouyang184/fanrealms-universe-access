
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function LogoutPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    const performLogout = async () => {
      // Navigate to loading state first
      navigate('/logout/loading', { replace: true });
      
      try {
        await signOut();
        toast({
          title: "Logged out successfully",
          description: "You have been signed out of your account.",
        });
        // After successful logout, navigate back to the logout confirmation page
        navigate('/logout', { replace: true });
      } catch (error) {
        console.error("Error logging out:", error);
        toast({
          title: "Logout failed",
          description: "There was an issue signing you out. Please try again.",
          variant: "destructive",
        });
        // If logout fails, go back to home
        navigate('/', { replace: true });
      }
    };
    
    performLogout();
  }, [signOut, navigate, toast]);

  // This component doesn't need to render anything as it redirects immediately
  return null;
}
