
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./components/theme-provider";
import Index from "./pages/Index";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Creator from "./pages/Creator";
import Explore from "./pages/Explore";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Subscriptions from "./pages/Subscriptions";
import Feed from "./pages/Feed";
import Following from "./pages/Following";
import Messages from "./pages/Messages";
import AuthCallback from "./pages/AuthCallback";
import CreatorDashboard from "./pages/creator-studio/Dashboard";
import CreatorPosts from "./pages/creator-studio/Posts";
import CreatorSettings from "./pages/creator-studio/Settings";
import CreatorProfile from "./pages/creator-studio/CreatorProfile";
import CreatorSubscribers from "./pages/creator-studio/Subscribers";
import CreatorMembershipTiers from "./pages/creator-studio/MembershipTiers";
import CreatorNotifications from "./pages/creator-studio/Notifications";
import CreatorPayouts from "./pages/creator-studio/Payouts";
import ContentCalendar from "./pages/creator-studio/ContentCalendar";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/home" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/creator/:id" element={<Creator />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/subscriptions" element={<Subscriptions />} />
                <Route path="/feed" element={<Feed />} />
                <Route path="/following" element={<Following />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/creator-studio" element={<CreatorDashboard />} />
                <Route path="/creator-studio/posts" element={<CreatorPosts />} />
                <Route path="/creator-studio/settings" element={<CreatorSettings />} />
                <Route path="/creator-studio/profile" element={<CreatorProfile />} />
                <Route path="/creator-studio/subscribers" element={<CreatorSubscribers />} />
                <Route path="/creator-studio/membership-tiers" element={<CreatorMembershipTiers />} />
                <Route path="/creator-studio/notifications" element={<CreatorNotifications />} />
                <Route path="/creator-studio/payouts" element={<CreatorPayouts />} />
                <Route path="/creator-studio/content-calendar" element={<ContentCalendar />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
