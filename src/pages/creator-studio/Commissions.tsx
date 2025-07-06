
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCommissionRequests } from '@/hooks/useCommissionRequests';
import { useCommissionActions } from '@/hooks/useCommissionActions';
import { useCommissionTypes } from '@/hooks/useCommissionTypes';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import { RequestsTab } from '@/components/creator-studio/commissions/RequestsTab';
import { OverviewTab } from '@/components/creator-studio/commissions/OverviewTab';
import { CommissionTypesTab } from '@/components/creator-studio/commissions/CommissionTypesTab';
import { SettingsTab } from '@/components/creator-studio/commissions/SettingsTab';

export default function Commissions() {
  const [activeTab, setActiveTab] = useState('overview');
  const { requests, isLoading } = useCommissionRequests();
  const { commissionTypes, isLoading: typesLoading, deleteCommissionType, refetchCommissionTypes } = useCommissionTypes();
  const { creatorProfile } = useCreatorProfile();
  const { 
    acceptCommission, 
    rejectCommission, 
    createPaymentSession,
    updateStatus,
    isProcessing 
  } = useCommissionActions();

  // Count pending requests (now only truly pending ones, not payment-pending)
  const pendingRequests = requests.filter(r => r.status === 'pending').length;
  const inProgressRequests = requests.filter(r => ['accepted', 'paid', 'in_progress'].includes(r.status)).length;
  const activeTypes = commissionTypes.filter(t => t.is_active).length;
  
  // Calculate monthly earnings (placeholder for now)
  const monthlyEarnings = 0;

  const handleViewAllRequests = () => {
    setActiveTab('requests');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Commissions</h1>
        <p className="text-muted-foreground">
          Manage your commission types, requests, and deliverables
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requests" className="relative">
            Requests
            {pendingRequests > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {pendingRequests}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="types">Commission Types</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab
            activeTypes={activeTypes}
            pendingRequests={pendingRequests}
            inProgressRequests={inProgressRequests}
            monthlyEarnings={monthlyEarnings}
            requests={requests}
            onViewAllRequests={handleViewAllRequests}
          />
        </TabsContent>
        
        <TabsContent value="requests">
          <RequestsTab
            requests={requests}
            isLoading={isLoading}
            pendingRequests={pendingRequests}
            onAcceptRequest={acceptCommission}
            onRejectRequest={rejectCommission}
            onCreatePayment={createPaymentSession}
            onUpdateStatus={updateStatus}
          />
        </TabsContent>

        <TabsContent value="types">
          <CommissionTypesTab
            commissionTypes={commissionTypes}
            isLoading={typesLoading}
            onDeleteCommissionType={deleteCommissionType}
            onRefetchCommissionTypes={refetchCommissionTypes}
          />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsTab creatorProfile={creatorProfile} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
