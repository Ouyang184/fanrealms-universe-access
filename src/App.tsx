
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import AuthGuard from "@/components/AuthGuard";
import { MainLayout } from "@/components/Layout/MainLayout";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Explore from "./pages/Explore";
import Notifications from "./pages/Notifications";
import Messages from "./pages/Messages";  // Import the new Messages page
import Purchases from "./pages/Purchases";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Creator from "./pages/Creator";
import CompleteProfile from "./pages/CompleteProfile";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";

// Creator Studio Pages
import CreatorStudioDashboard from "./pages/creator-studio/Dashboard";
import CreatorStudioPosts from "./pages/creator-studio/Posts";
import CreatorStudioMembershipTiers from "./pages/creator-studio/MembershipTiers";
import CreatorStudioSubscribers from "./pages/creator-studio/Subscribers";
import CreatorStudioPayouts from "./pages/creator-studio/Payouts";
import CreatorStudioSettings from "./pages/creator-studio/Settings";
import CreatorMessages from "./pages/creator-studio/Messages";

const queryClient = new QueryClient();

const App: React.FC = () => (
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/explore" element={<Explore />} />

              {/* Protected routes */}
              <Route path="/dashboard" element={
                <AuthGuard>
                  <Dashboard />
                </AuthGuard>
              } />
              <Route path="/profile" element={
                <AuthGuard>
                  <Profile />
                </AuthGuard>
              } />
              <Route path="/creator/:id" element={
                <AuthGuard requireAuth={false}>
                  <Creator />
                </AuthGuard>
              } />
              <Route path="/notifications" element={
                <AuthGuard>
                  <Notifications />
                </AuthGuard>
              } />
              <Route path="/messages" element={
                <AuthGuard>
                  <Messages />
                </AuthGuard>
              } />
              <Route path="/purchases" element={
                <AuthGuard>
                  <Purchases />
                </AuthGuard>
              } />
              <Route path="/settings" element={
                <AuthGuard>
                  <Settings />
                </AuthGuard>
              } />
              <Route path="/complete-profile" element={
                <AuthGuard requireCompleteProfile={false}>
                  <CompleteProfile />
                </AuthGuard>
              } />
              
              {/* Creator Studio routes */}
              <Route path="/creator-studio" element={
                <AuthGuard>
                  <MainLayout>
                    <CreatorStudioDashboard />
                  </MainLayout>
                </AuthGuard>
              } />
              <Route path="/creator-studio/messages" element={
                <AuthGuard>
                  <CreatorMessages />
                </AuthGuard>
              } />
              <Route path="/creator-studio/posts" element={
                <AuthGuard>
                  <MainLayout>
                    <CreatorStudioPosts />
                  </MainLayout>
                </AuthGuard>
              } />
              <Route path="/creator-studio/tiers" element={
                <AuthGuard>
                  <MainLayout>
                    <CreatorStudioMembershipTiers />
                  </MainLayout>
                </AuthGuard>
              } />
              <Route path="/creator-studio/subscribers" element={
                <AuthGuard>
                  <MainLayout>
                    <CreatorStudioSubscribers />
                  </MainLayout>
                </AuthGuard>
              } />
              <Route path="/creator-studio/payouts" element={
                <AuthGuard>
                  <MainLayout>
                    <CreatorStudioPayouts />
                  </MainLayout>
                </AuthGuard>
              } />
              <Route path="/creator-studio/settings" element={
                <AuthGuard>
                  <MainLayout>
                    <CreatorStudioSettings />
                  </MainLayout>
                </AuthGuard>
              } />
              
              {/* Fallback routes */}
              <Route path="/home" element={<Navigate to="/" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

export default App;
