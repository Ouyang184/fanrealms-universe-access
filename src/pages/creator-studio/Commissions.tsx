
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
      const { data, error } = await supabase
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
      const { error } = await supabase
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
  const monthlyEarnings = 0; // Commission earnings calculation will be implemented when payment tracking is added

  return (
    <div className="min-h-screen p-3 sm:p-6">
      <div className="w-full max-w-6xl mx-auto space-y-4 sm:space-y-6 min-h-[calc(100vh-3rem)]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Commission Management</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage your commission types, slots, and requests
            </p>
          </div>
          <CreateCommissionTypeModal onSuccess={fetchCommissionTypes}>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              <span className="sm:hidden">New Type</span>
              <span className="hidden sm:inline">New Commission Type</span>
            </Button>
          </CreateCommissionTypeModal>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <div className="flex justify-center">
            <TabsList className="grid grid-cols-4 w-full max-w-2xl h-auto">
              <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
                <span className="sm:hidden">Overview</span>
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="types" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
                <span className="sm:hidden">Types</span>
                <span className="hidden sm:inline">Commission Types</span>
              </TabsTrigger>
              <TabsTrigger value="requests" className="relative text-xs sm:text-sm px-2 sm:px-4 py-2">
                <span className="sm:hidden">Requests</span>
                <span className="hidden sm:inline">Requests</span>
                {pendingRequests > 0 && (
                  <Badge className="ml-1 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 text-xs bg-red-500 flex items-center justify-center">
                    {pendingRequests}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
                <span className="sm:hidden">Settings</span>
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>
          </div>

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
    </div>
  );
}
