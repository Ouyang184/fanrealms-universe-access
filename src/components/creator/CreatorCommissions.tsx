
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, DollarSign, Star, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import LoadingSpinner from "@/components/LoadingSpinner";
import { CommissionType } from "@/types/commission";
import { CreatorProfile } from "@/types";

interface CreatorCommissionsProps {
  creator: CreatorProfile;
}

export function CreatorCommissions({ creator }: CreatorCommissionsProps) {
  const [commissionTypes, setCommissionTypes] = useState<CommissionType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCommissionData = async () => {
      try {
        console.log('Fetching commission data for creator:', creator.id);
        
        // Fetch commission types directly from the database
        const { data: types, error: typesError } = await supabase
          .from('commission_types')
          .select('*')
          .eq('creator_id', creator.id)
          .eq('is_active', true)
          .order('base_price');

        if (typesError) {
          console.error('Error fetching commission types:', typesError);
        } else {
          console.log('Commission types fetched:', types);
          setCommissionTypes(types || []);
        }
      } catch (error) {
        console.error('Error fetching commission data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (creator.id) {
      fetchCommissionData();
    }
  }, [creator.id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

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
  }

  if (commissionTypes.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Commission Types Available</h3>
        <p className="text-muted-foreground">
          This creator hasn't set up any commission types yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Creator Commission Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Commission Information
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
        <h3 className="text-xl font-semibold">Available Commission Types</h3>
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
                
                <Button className="w-full" size="sm">
                  Request Commission
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
