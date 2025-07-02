
import React, { useState } from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileHeader } from '@/components/creator-studio/profile/ProfileHeader';
import { ProfilePostsTab } from '@/components/creator-studio/profile/ProfilePostsTab';
import { ProfileMembershipTab } from '@/components/creator-studio/profile/ProfileMembershipTab';
import { CreatorAbout } from '@/components/creator/CreatorAbout';
import { CreatorCommissions } from '@/components/creator/CreatorCommissions';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';

const CreatorProfile = () => {
  const [activeTab, setActiveTab] = useState('posts');
  const { creatorProfile, isLoading } = useCreatorProfile();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">Loading creator profile...</div>
        </div>
      </MainLayout>
    );
  }

  if (!creatorProfile) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Creator Profile Not Found</h2>
          <p className="text-muted-foreground">Unable to load creator profile.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <ProfileHeader creator={creatorProfile} />
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 max-w-2xl mx-auto h-11">
            <TabsTrigger value="posts" className="text-sm font-medium">Posts</TabsTrigger>
            <TabsTrigger value="membership" className="text-sm font-medium">Membership</TabsTrigger>
            <TabsTrigger value="commissions" className="text-sm font-medium">Commissions</TabsTrigger>
            <TabsTrigger value="about" className="text-sm font-medium">About</TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="mt-6">
            <ProfilePostsTab creatorId={creatorProfile.id} />
          </TabsContent>
          
          <TabsContent value="membership" className="mt-6">
            <ProfileMembershipTab creatorId={creatorProfile.id} />
          </TabsContent>
          
          <TabsContent value="commissions" className="mt-6">
            <CreatorCommissions creatorId={creatorProfile.id} />
          </TabsContent>
          
          <TabsContent value="about" className="mt-6">
            <CreatorAbout creator={creatorProfile} />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default CreatorProfile;
