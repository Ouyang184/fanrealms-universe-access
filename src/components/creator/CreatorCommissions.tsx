import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, DollarSign, Star, Image as ImageIcon, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import LoadingSpinner from "@/components/LoadingSpinner";
import { CommissionType } from "@/types/commission";
import { CreatorProfile } from "@/types";
import { toast } from "@/hooks/use-toast";
import { CommissionRequestModal } from "./CommissionRequestModal";
import { useAuth } from "@/contexts/AuthContext";

interface CreatorCommissionsProps {
  creator: CreatorProfile;
}

export function CreatorCommissions({ creator }: CreatorCommissionsProps) {
  const { user } = useAuth();
  const [commissionTypes, setCommissionTypes] = useState<CommissionType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if current user is the creator
  const isOwnCreator = user?.id === creator.user_id;

  useEffect(() => {
    const fetchCommissionData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('[CreatorCommissions] Fetching commission data for creator:', {
          creatorId: creator.id,
          acceptsCommissions: creator.accepts_commissions,
          creatorData: creator
        });
        
        if (!creator.id) {
          console.warn('[CreatorCommissions] No creator ID provided');
          setError('Creator ID is missing');
          return;
        }
        
        // Always fetch commission types regardless of accepts_commissions flag
        // This allows us to show what's available even if the flag is wrong
        const { data: types, error: typesError } = await supabase
          .from('commission_types')
          .select('*')
          .eq('creator_id', creator.id)
          .eq('is_active', true)
          .order('base_price');

        console.log('[CreatorCommissions] Commission types query result:', {
          data: types,
          error: typesError,
          count: types?.length || 0
        });

        if (typesError) {
          console.error('[CreatorCommissions] Error fetching commission types:', typesError);
          setError(`Failed to load commission types: ${typesError.message}`);
          toast({
            title: "Error",
            description: "Failed to load commission types",
            variant: "destructive"
          });
        } else {
          console.log('[CreatorCommissions] Successfully loaded commission types:', types?.length || 0);
          // Transform the data to match our TypeScript interface
          const transformedTypes = (types || []).map(type => ({
            ...type,
            custom_addons: Array.isArray(type.custom_addons) ? type.custom_addons : []
          })) as CommissionType[];
          setCommissionTypes(transformedTypes);
        }
      } catch (error) {
        console.error('[CreatorCommissions] Unexpected error fetching commission data:', error);
        setError('An unexpected error occurred while loading commissions');
        toast({
          title: "Error",
          description: "An unexpected error occurred while loading commissions",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (creator.id) {
      fetchCommissionData();
    } else {
      setIsLoading(false);
      setError('No creator data available');
    }
  }, [creator.id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner />
        <span className="ml-2">Loading commission data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Error Loading Commissions</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
        >
          Retry
        </Button>
      </div>
    );
  }

  // Show commission types if they exist, regardless of accepts_commissions flag
  if (commissionTypes.length === 0) {
    // Only show "not accepting" if there are no commission types AND accepts_commissions is false
    if (!creator.accepts_commissions) {
      return (
        <div className="text-center py-12">
          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Commissions Not Available</h3>
          <p className="text-muted-foreground">
            This creator is not currently accepting commissions.
          </p>
        </div>
      );
    } else {
      return (
        <div className="text-center py-12">
          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Commission Types Available</h3>
          <p className="text-muted-foreground">
            This creator hasn't set up any commission types yet.
          </p>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Debug info: Creator accepts commissions: {creator.accepts_commissions ? 'Yes' : 'No'}, but no commission types found.
            </p>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="space-y-8">
      {/* Creator Commission Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Commission Information
            {!creator.accepts_commissions && (
              <Badge variant="secondary" className="ml-2">
                Currently Closed
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm">Starting from ${creator.commission_base_rate || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm">{creator.commission_turnaround_days || 7} days turnaround</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              <span className="text-sm">{creator.commission_slots_available || 0} slots available</span>
            </div>
          </div>
          {creator.commission_tos && (
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Terms of Service</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {creator.commission_tos}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Commission Types */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold">
          Available Commission Types ({commissionTypes.length})
          {!creator.accepts_commissions && (
            <span className="text-sm font-normal text-muted-foreground ml-2">
              (Currently not accepting new commissions)
            </span>
          )}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {commissionTypes.map((type) => (
            <Card key={type.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{type.name}</CardTitle>
                  <Badge variant="secondary">${type.base_price}</Badge>
                </div>
                {type.description && (
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Sample Art Display */}
                {type.sample_art_url && (
                  <div className="relative">
                    <img
                      src={type.sample_art_url}
                      alt={`Sample art for ${type.name}`}
                      className="w-full h-40 object-cover rounded-lg border"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-black/70 text-white border-0 text-xs">
                        Sample Work
                      </Badge>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
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
                
                {type.dos && type.dos.length > 0 && (
                  <div>
                    <h5 className="font-medium text-green-700 mb-2">✓ Will Do:</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {type.dos.map((item, index) => (
                        <li key={index}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {type.donts && type.donts.length > 0 && (
                  <div>
                    <h5 className="font-medium text-red-700 mb-2">✗ Won't Do:</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {type.donts.map((item, index) => (
                        <li key={index}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <CommissionRequestModal 
                  commissionTypes={commissionTypes} 
                  creatorId={creator.id}
                  specificCommissionType={type}
                >
                  <Button 
                    className="w-full" 
                    size="sm"
                    disabled={!creator.accepts_commissions || isOwnCreator}
                  >
                    {isOwnCreator 
                      ? 'Cannot Request Own Commission' 
                      : creator.accepts_commissions 
                        ? 'Request Commission' 
                        : 'Currently Closed'
                    }
                  </Button>
                </CommissionRequestModal>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
