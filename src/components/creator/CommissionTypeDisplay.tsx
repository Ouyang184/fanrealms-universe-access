
import { CommissionType } from '@/types/commission';

interface CommissionTypeDisplayProps {
  commissionType: CommissionType;
}

export function CommissionTypeDisplay({ commissionType }: CommissionTypeDisplayProps) {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <h4 className="font-medium mb-2">{commissionType.name}</h4>
      <p className="text-sm text-muted-foreground mb-2">{commissionType.description}</p>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>Base Price: ${commissionType.base_price}</div>
        <div>Turnaround: {commissionType.estimated_turnaround_days} days</div>
        <div>Max Revisions: {commissionType.max_revisions}</div>
        {commissionType.price_per_character && (
          <div>Per Character: +${commissionType.price_per_character}</div>
        )}
      </div>
      
      {/* Display custom add-ons */}
      {commissionType.custom_addons && commissionType.custom_addons.length > 0 && (
        <div className="mt-4">
          <h5 className="font-medium text-blue-700 mb-2">Custom Add-ons:</h5>
          <div className="space-y-1">
            {commissionType.custom_addons.map((addon, index) => (
              <div key={index} className="text-sm">
                <span className="font-medium">{addon.name}:</span> +${addon.price}
                {addon.description && (
                  <span className="text-muted-foreground ml-2">({addon.description})</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
