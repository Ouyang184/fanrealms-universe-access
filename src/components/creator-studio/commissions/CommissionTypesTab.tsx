
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Clock, 
  DollarSign, 
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { CommissionPreviewModal } from './CommissionPreviewModal';
import { EditCommissionTypeModal } from './EditCommissionTypeModal';

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
  sample_art_url?: string;
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
  const [previewType, setPreviewType] = useState<CommissionType | null>(null);
  const [editType, setEditType] = useState<CommissionType | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const handlePreview = (type: CommissionType) => {
    setPreviewType(type);
    setShowPreview(true);
  };

  const handleEdit = (type: CommissionType) => {
    setEditType(type);
    setShowEdit(true);
  };
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (commissionTypes.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Commission Types</h3>
          <p className="text-muted-foreground">
            Create your first commission type to start accepting commissions
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {commissionTypes.map((type) => (
        <Card key={type.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  {type.name}
                  <Badge variant={type.is_active ? "default" : "secondary"}>
                    {type.is_active ? "Active" : "Inactive"}
                  </Badge>
                </CardTitle>
                {type.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {type.description}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Sample Art Display */}
            {type.sample_art_url && (
              <div className="relative">
                <img
                  src={type.sample_art_url}
                  alt={`Sample art for ${type.name}`}
                  className="w-full h-32 object-cover rounded-lg border"
                />
                <div className="absolute top-2 right-2">
                  <Badge className="bg-black/50 text-white border-0">
                    Sample
                  </Badge>
                </div>
              </div>
            )}

            {/* Pricing and Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="font-medium">${type.base_price}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span>{type.estimated_turnaround_days} days</span>
              </div>
              <div>
                <span className="font-medium">Max Revisions:</span> {type.max_revisions}
              </div>
              {type.price_per_revision && (
                <div>
                  <span className="font-medium">Extra Revision:</span> +${type.price_per_revision}
                </div>
              )}
              {type.price_per_character && (
                <div>
                  <span className="font-medium">Per Character:</span> +${type.price_per_character}
                </div>
              )}
            </div>

            {/* Will Do / Won't Do Lists */}
            {type.dos && type.dos.length > 0 && (
              <div>
                <h5 className="font-medium text-green-700 mb-2 text-sm">✓ Will Do:</h5>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {type.dos.slice(0, 3).map((item, index) => (
                    <li key={index}>• {item}</li>
                  ))}
                  {type.dos.length > 3 && (
                    <li className="text-xs italic">+{type.dos.length - 3} more...</li>
                  )}
                </ul>
              </div>
            )}

            {type.donts && type.donts.length > 0 && (
              <div>
                <h5 className="font-medium text-red-700 mb-2 text-sm">✗ Won't Do:</h5>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {type.donts.slice(0, 2).map((item, index) => (
                    <li key={index}>• {item}</li>
                  ))}
                  {type.donts.length > 2 && (
                    <li className="text-xs italic">+{type.donts.length - 2} more...</li>
                  )}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => handlePreview(type)}
              >
                <Eye className="h-3 w-3 mr-1" />
                Preview
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => handleEdit(type)}
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => onDeleteCommissionType(type.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Modals */}
      <CommissionPreviewModal
        commissionType={previewType}
        open={showPreview}
        onOpenChange={setShowPreview}
      />

      <EditCommissionTypeModal
        commissionType={editType}
        open={showEdit}
        onOpenChange={setShowEdit}
        onSuccess={() => {
          onRefetchCommissionTypes();
          setShowEdit(false);
        }}
      />
    </div>
  );
}
