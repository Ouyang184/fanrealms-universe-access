
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Calendar, RotateCcw, Loader2 } from 'lucide-react';
import { formatCancelDate } from '../utils/dateFormatters';

interface CancellationWarningStateProps {
  tierName: string;
  cancelDate: string | number;
  onReactivate: () => Promise<void>;
}

export function CancellationWarningState({ 
  tierName, 
  cancelDate, 
  onReactivate 
}: CancellationWarningStateProps) {
  const [isReactivating, setIsReactivating] = useState(false);

  const handleReactivate = async () => {
    if (isReactivating) return;
    
    setIsReactivating(true);
    try {
      await onReactivate();
    } finally {
      setIsReactivating(false);
    }
  };

  const formattedDate = formatCancelDate(cancelDate);

  return (
    <div className="space-y-3">
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center mb-2">
          <AlertCircle className="mr-2 h-5 w-5 text-yellow-600" />
          <span className="font-medium text-yellow-800">
            Subscription will end on {formattedDate}
          </span>
        </div>
        <div className="text-center">
          <Badge variant="outline" className="text-xs bg-yellow-100 border-yellow-300">
            <Calendar className="mr-1 h-3 w-3" />
            Active until {formattedDate}
          </Badge>
        </div>
      </div>
      
      <Button 
        variant="default" 
        className="w-full bg-green-600 hover:bg-green-700"
        onClick={handleReactivate}
        disabled={isReactivating}
      >
        {isReactivating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Reactivating...
          </>
        ) : (
          <>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reactivate before this date
          </>
        )}
      </Button>
      
      <p className="text-xs text-muted-foreground text-center">
        Reactivate your subscription to continue enjoying {tierName} benefits beyond {formattedDate}.
      </p>
    </div>
  );
}
