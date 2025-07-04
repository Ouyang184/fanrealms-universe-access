
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
    </div>
  );
}
