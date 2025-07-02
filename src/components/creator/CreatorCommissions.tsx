
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, DollarSign, Star, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import LoadingSpinner from "@/components/LoadingSpinner";
import { CommissionType, CommissionPortfolio, CommissionTag } from "@/types/commission";
import { CreatorProfile } from "@/types";

interface CreatorCommissionsProps {
  creator: CreatorProfile;
}

export function CreatorCommissions({ creator }: CreatorCommissionsProps) {
  const [commissionTypes, setCommissionTypes] = useState<CommissionType[]>([]);
  const [portfolioImages, setPortfolioImages] = useState<CommissionPortfolio[]>([]);
  const [tags, setTags] = useState<CommissionTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCommissionData = async () => {
      try {
        // Fetch commission types
        const { data: types } = await supabase
          .from('commission_types')
          .select('*')
          .eq('creator_id', creator.id)
          .eq('is_active', true)
          .order('base_price');

        // Fetch portfolio images
        const { data: portfolio } = await supabase
          .from('commission_portfolios')
          .select('*')
          .eq('creator_id', creator.id)
          .order('display_order');

        // Fetch commission tags
        const { data: commissionTags } = await supabase
          .from('commission_tags')
          .select('*')
          .eq('is_featured', true)
          .order('name');

        setCommissionTypes(types || []);
        setPortfolioImages(portfolio || []);
        setTags(commissionTags || []);
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

  if (!creator.accepts_commissions || commissionTypes.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Commissions Available</h3>
        <p className="text-muted-foreground">
          This creator is not currently accepting commissions.
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
                
                <Button className="w-full" size="sm">
                  Request Commission
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Portfolio Gallery */}
      {portfolioImages.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Commission Portfolio</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {portfolioImages.map((image) => (
              <div key={image.id} className="group relative aspect-square overflow-hidden rounded-lg">
                <img
                  src={image.image_url}
                  alt={image.title || 'Commission example'}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                {image.is_featured && (
                  <Badge className="absolute top-2 left-2" variant="secondary">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
                {image.title && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2">
                    <p className="text-sm font-medium truncate">{image.title}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Commission Tags */}
      {tags.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Specialties</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                style={{ borderColor: tag.color_hex, color: tag.color_hex }}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
