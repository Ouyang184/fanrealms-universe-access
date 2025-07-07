
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Palette, Trash2 } from 'lucide-react';
import { CreateCommissionTypeModal } from './CreateCommissionTypeModal';
import LoadingSpinner from '@/components/LoadingSpinner';

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
  custom_addons?: any[];
  is_active: boolean;
  created_at: string;
}

interface CommissionTypesTabProps {
  commissionTypes: CommissionType[];
  isLoading: boolean;
  onDeleteCommissionType: (id: string) => void;
  onRefetchCommissionTypes: () => void;
}

export function CommissionTypesTab({
  commissionTypes,
  isLoading,
  onDeleteCommissionType,
  onRefetchCommissionTypes
}: CommissionTypesTabProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Commission Types</CardTitle>
          <p className="text-sm text-muted-foreground">
            Define the types of commissions you offer and their pricing
          </p>
        </div>
        <CreateCommissionTypeModal onSuccess={onRefetchCommissionTypes}>
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
            <CreateCommissionTypeModal onSuccess={onRefetchCommissionTypes}>
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
                      onClick={() => onDeleteCommissionType(type.id)}
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

                {/* Display custom add-ons */}
                {type.custom_addons && type.custom_addons.length > 0 && (
                  <div className="mt-4">
                    <h5 className="font-medium text-blue-700 mb-2">Custom Add-ons:</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {type.custom_addons.map((addon, index) => (
                        <div key={index} className="text-sm bg-blue-50 p-2 rounded">
                          <span className="font-medium">{addon.name}:</span> +${addon.price}
                          {addon.description && (
                            <div className="text-muted-foreground text-xs">{addon.description}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
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
  );
}
