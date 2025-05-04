
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AuthCallback from "./pages/AuthCallback";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import OnboardingPage from "./pages/Onboarding";
import { AuthProvider } from "@/contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import LoadingPage from "./pages/Loading";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import HomePage from "./pages/Home";
import { TooltipProvider } from "@/components/ui/tooltip";
import SubscriptionsPage from "./pages/Subscriptions";
import RootLayout from "@/components/RootLayout";

// Create a client
const queryClient = new QueryClient();

export default function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <RootLayout>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/home" element={<HomePage />} />
                
                {/* Auth routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                
                {/* Main app routes */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/subscriptions" element={<SubscriptionsPage />} />
                <Route path="/explore" element={<Dashboard />} /> {/* Placeholder */}
                <Route path="/messages" element={<Dashboard />} /> {/* Placeholder */}
                <Route path="/notifications" element={<Dashboard />} /> {/* Placeholder */}
                <Route path="/favorites" element={<Dashboard />} /> {/* Placeholder */}
                <Route path="/settings" element={<Dashboard />} /> {/* Placeholder */}
                
                {/* Creator studio routes */}
                <Route path="/creator-studio/dashboard" element={<Dashboard />} /> {/* Placeholder */}
                <Route path="/creator-studio/posts" element={<Dashboard />} /> {/* Placeholder */}
                <Route path="/creator-studio/messages" element={<Dashboard />} /> {/* Placeholder */}
                <Route path="/creator-studio/membership-tiers" element={<Dashboard />} /> {/* Placeholder */}
                <Route path="/creator-studio/subscribers" element={<Dashboard />} /> {/* Placeholder */}
                <Route path="/creator-studio/payouts" element={<Dashboard />} /> {/* Placeholder */}
                <Route path="/creator-studio/settings" element={<Dashboard />} /> {/* Placeholder */}
                
                <Route path="/loading" element={<LoadingPage />} />
              </Routes>
              <Toaster />
            </RootLayout>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}
