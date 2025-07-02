
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCreatorCommissions } from '@/hooks/useCreatorCommissions';
import { Clock, DollarSign, Calendar, Palette, MessageSquare } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { CommissionBookingModal } from './CommissionBookingModal';
import { CommissionPortfolio } from './CommissionPortfolio';

interface CreatorCommissionsProps {
  creatorId: string;
}

export function CreatorCommissions({ creatorId }: CreatorCommissionsProps) {
  const { 
    commissionTypes, 
    availableSlots, 
    portfolioItems, 
    isLoading, 
    creator 
  } = useCreatorCommissions(creatorId);
  
  const [selectedCommissionType, setSelectedCommissionType] = React.useState<string | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = React.useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  // Check if creator accepts commissions (fallback to false if property doesn't exist)
  const acceptsCommissions = (creator as any)?.accepts_commissions || false;
  const commissionInfo = (creator as any)?.commission_info || {};
  const commissionTos = (creator as any)?.commission_tos;

  if (!acceptsCommissions) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Palette className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Commissions Not Available</h3>
          <p className="text-muted-foreground">
            This creator is not currently accepting commission requests.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleBookCommission = (commissionTypeId: string) => {
    setSelectedCommissionType(commissionTypeId);
    setIsBookingModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Commission Info Panel */}
      {commissionInfo && Object.keys(commissionInfo).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Commission Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {commissionInfo.about && (
              <div>
                <h4 className="font-medium mb-2">About My Commissions</h4>
                <p className="text-muted-foreground">{commissionInfo.about}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {commissionInfo.turnaround_time && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Typical turnaround: {commissionInfo.turnaround_time}
                  </span>
                </div>
              )}
              
              {commissionInfo.revisions && (
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Revisions: {commissionInfo.revisions}
                  </span>
                </div>
              )}
              
              {availableSlots > 0 && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">
                    {availableSlots} slots available
                  </span>
                </div>
              )}
            </div>

            {commissionInfo.dos && commissionInfo.dos.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-green-600">What I Do</h4>
                <div className="flex flex-wrap gap-2">
                  {commissionInfo.dos.map((item: string, index: number) => (
                    <Badge key={index} variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {commissionInfo.donts && commissionInfo.donts.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-red-600">What I Don't Do</h4>
                <div className="flex flex-wrap gap-2">
                  {commissionInfo.donts.map((item: string, index: number) => (
                    <Badge key={index} variant="secondary" className="bg-red-50 text-red-700 border-red-200">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Portfolio */}
      {portfolioItems && portfolioItems.length > 0 && (
        <CommissionPortfolio items={portfolioItems} />
      )}

      {/* Commission Types */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Available Commission Types</h3>
        {commissionTypes && commissionTypes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {commissionTypes.map((type: any) => (
              <Card key={type.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{type.name}</span>
                    <div className="flex items-center gap-1 text-primary">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-bold">
                        {type.min_price && type.max_price && type.min_price !== type.max_price
                          ? `$${type.min_price} - $${type.max_price}`
                          : `$${type.base_price}`
                        }
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {type.description && (
                    <p className="text-muted-foreground">{type.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{type.estimated_days} days</span>
                    </div>
                  </div>

                  <Button 
                    onClick={() => handleBookCommission(type.id)}
                    className="w-full"
                    disabled={availableSlots === 0}
                  >
                    {availableSlots === 0 ? 'Slots Full' : 'Request Commission'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <Palette className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No commission types available yet.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Terms of Service */}
      {commissionTos && (
        <Card>
          <CardHeader>
            <CardTitle>Terms of Service</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{commissionTos}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Booking Modal */}
      <CommissionBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        creatorId={creatorId}
        commissionTypeId={selectedCommissionType}
      />
    </div>
  );
}
