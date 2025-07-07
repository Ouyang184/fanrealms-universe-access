
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";
import { CreateCommissionTypeModal } from "@/components/creator-studio/commissions/CreateCommissionTypeModal";
import { useCommissionRequests } from "@/hooks/useCommissionRequests";
import { toast } from "@/hooks/use-toast";
import { OverviewTab } from "@/components/creator-studio/commissions/OverviewTab";
import { CommissionTypesTab } from "@/components/creator-studio/commissions/CommissionTypesTab";
import { RequestsTab } from "@/components/creator-studio/commissions/RequestsTab";
import { SettingsTab } from "@/components/creator-studio/commissions/SettingsTab";

interface CommissionType {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  price_per_character?: number;
  price_per_revision?: number;
  estimated_turnaround_days: number;
  max_revisions: number;
  dos: string[];
  donts: string[];
  is_active: boolean;
  created_at: string;
}

export default function Commissions() {
  const [activeTab, setActiveTab] = useState("overview");
  const [commissionTypes, setCommissionTypes] = useState<CommissionType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { creatorProfile } = useCreatorProfile();
  const { 
    requests, 
    isLoading: requestsLoading, 
    acceptRequest, 
    rejectRequest, 
    updateRequestStatus 
  } = useCommissionRequests();

  const fetchCommissionTypes = async () => {
    if (!creatorProfile?.id) return;
    
    try {
      const { data, error } = await (supabase as any)
        .from('commission_types')
        .select('*')
        .eq('creator_id', creatorProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCommissionTypes(data || []);
    } catch (error) {
      console.error('Error fetching commission types:', error);
      toast({
        title: "Error",
        description: "Failed to load commission types",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (creatorProfile?.id) {
      fetchCommissionTypes();
    }
  }, [creatorProfile?.id]);

  const handleDeleteCommissionType = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('commission_types')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Commission type deleted successfully"
      });
      
      fetchCommissionTypes();
    } catch (error) {
      console.error('Error deleting commission type:', error);
      toast({
        title: "Error",
        description: "Failed to delete commission type",
        variant: "destructive"
      });
    }
  };

  // Calculate stats
  const activeTypes = commissionTypes.filter(type => type.is_active);
  const openSlots = creatorProfile?.commission_slots_available || 0;
  const pendingRequests = requests.filter(req => req.status === 'pending').length;
  const inProgressRequests = requests.filter(req => ['in_progress', 'delivered', 'under_review'].includes(req.status)).length;
  const monthlyEarnings = 0; // TODO: Calculate from commission earnings when implemented

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Commission Management</h1>
          <p className="text-muted-foreground">
            Manage your commission types, slots, and requests
          </p>
        </div>
        <CreateCommissionTypeModal onSuccess={fetchCommissionTypes}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Commission Type
          </Button>
        </CreateCommissionTypeModal>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="types">Commission Types</TabsTrigger>
          <TabsTrigger value="requests" className="relative">
            Requests
            {pendingRequests > 0 && (
              <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs bg-red-500">
                {pendingRequests}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab
            activeTypes={activeTypes.length}
            pendingRequests={pendingRequests}
            inProgressRequests={inProgressRequests}
            monthlyEarnings={monthlyEarnings}
            requests={requests}
            onViewAllRequests={() => setActiveTab('requests')}
          />
        </TabsContent>

        <TabsContent value="types">
          <CommissionTypesTab
            commissionTypes={commissionTypes}
            isLoading={isLoading}
            onDeleteCommissionType={handleDeleteCommissionType}
            onRefetchCommissionTypes={fetchCommissionTypes}
          />
        </TabsContent>

        <TabsContent value="requests">
          <RequestsTab
            requests={requests}
            isLoading={requestsLoading}
            pendingRequests={pendingRequests}
            onAcceptRequest={acceptRequest}
            onRejectRequest={rejectRequest}
            onUpdateStatus={updateRequestStatus}
          />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsTab creatorProfile={creatorProfile} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
