import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Palette, Calendar, Settings, Eye, Edit, Trash2, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";
import { CreateCommissionTypeModal } from "@/components/creator-studio/commissions/CreateCommissionTypeModal";
import { CommissionSettingsModal } from "@/components/creator-studio/commissions/CommissionSettingsModal";
import { CommissionRequestCard } from "@/components/creator-studio/commissions/CommissionRequestCard";
import { useCommissionRequests } from "@/hooks/useCommissionRequests";
import { toast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/LoadingSpinner";

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
  const [isUpdatingCommissionStatus, setIsUpdatingCommissionStatus] = useState(false);
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

  const handleToggleCommissions = async (enabled: boolean) => {
    if (!creatorProfile?.id) return;
    
    setIsUpdatingCommissionStatus(true);
    try {
      const { error } = await (supabase as any)
        .from('creators')
        .update({ accepts_commissions: enabled })
        .eq('id', creatorProfile.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: enabled ? "Commissions are now open" : "Commissions are now closed"
      });
    } catch (error) {
      console.error('Error updating commission status:', error);
      toast({
        title: "Error",
        description: "Failed to update commission status",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingCommissionStatus(false);
    }
  };

  // Calculate real data from commission types and requests
  const activeTypes = commissionTypes.filter(type => type.is_active);
  const openSlots = creatorProfile?.commission_slots_available || 0;
  const pendingRequests = requests.filter(req => req.status === 'pending').length;
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

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards with Real Data */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Types</CardTitle>
                <Palette className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeTypes.length}</div>
                <p className="text-xs text-muted-foreground">
                  Commission types available
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Slots</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{openSlots}</div>
                <p className="text-xs text-muted-foreground">
                  Available booking slots
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                <Inbox className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingRequests}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting your response
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${monthlyEarnings}</div>
                <p className="text-xs text-muted-foreground">
                  Commission earnings
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Commission Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {requests.length > 0 ? (
                <div className="space-y-4">
                  {requests.slice(0, 3).map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{request.title}</p>
                        <p className="text-sm text-muted-foreground">
                          by @{request.customer?.username} • {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={`${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {request.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => setActiveTab('requests')}
                  >
                    View All Requests
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Inbox className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Recent Activity</h3>
                  <p className="text-muted-foreground">
                    Commission requests will appear here once customers start submitting them
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Commission Types</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Define the types of commissions you offer and their pricing
                </p>
              </div>
              <CreateCommissionTypeModal onSuccess={fetchCommissionTypes}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Commission Type
                </Button>
              </CreateCommissionTypeModal>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : commissionTypes.length === 0 ? (
                <div className="text-center py-12">
                  <Palette className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Commission Types Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first commission type to start accepting orders
                  </p>
                  <CreateCommissionTypeModal onSuccess={fetchCommissionTypes}>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Commission Type
                    </Button>
                  </CreateCommissionTypeModal>
                </div>
              ) : (
                <div className="space-y-4">
                  {commissionTypes.map((type) => (
                    <div key={type.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">{type.name}</h3>
                          {type.description && (
                            <p className="text-sm text-muted-foreground">{type.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={type.is_active ? "default" : "secondary"}>
                            {type.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">${type.base_price}</Badge>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteCommissionType(type.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Turnaround:</span> {type.estimated_turnaround_days} days
                        </div>
                        <div>
                          <span className="font-medium">Max Revisions:</span> {type.max_revisions}
                        </div>
                        {type.price_per_character && (
                          <div>
                            <span className="font-medium">Per Character:</span> +${type.price_per_character}
                          </div>
                        )}
                        {type.price_per_revision && (
                          <div>
                            <span className="font-medium">Extra Revision:</span> +${type.price_per_revision}
                          </div>
                        )}
                      </div>
                      
                      {(type.dos.length > 0 || type.donts.length > 0) && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {type.dos.length > 0 && (
                            <div>
                              <h5 className="font-medium text-green-700 mb-2">✓ Will Do:</h5>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {type.dos.map((item, index) => (
                                  <li key={index}>• {item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {type.donts.length > 0 && (
                            <div>
                              <h5 className="font-medium text-red-700 mb-2">✗ Won't Do:</h5>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {type.donts.map((item, index) => (
                                  <li key={index}>• {item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Inbox className="h-5 w-5" />
                Commission Requests
                {pendingRequests > 0 && (
                  <Badge className="bg-red-500">{pendingRequests} pending</Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage incoming commission requests from customers
              </p>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-12">
                  <Inbox className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Requests Yet</h3>
                  <p className="text-muted-foreground">
                    Commission requests will appear here once customers start booking
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {requests.map((request) => (
                    <CommissionRequestCard
                      key={request.id}
                      request={request}
                      onAccept={acceptRequest}
                      onReject={rejectRequest}
                      onUpdateStatus={updateRequestStatus}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Commission Settings</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure your commission preferences and availability
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Commission Terms</p>
                    <p className="text-sm text-muted-foreground">
                      {creatorProfile?.commission_tos 
                        ? "Terms of service configured" 
                        : "Set your terms of service for commission work"
                      }
                    </p>
                  </div>
                  <CommissionSettingsModal>
                    <Button variant="outline" size="sm">
                      Edit Terms
                    </Button>
                  </CommissionSettingsModal>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Portfolio Gallery</p>
                    <p className="text-sm text-muted-foreground">
                      Showcase examples of your commission work
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage Gallery
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
