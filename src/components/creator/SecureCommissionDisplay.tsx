import { DollarSign, Clock, Calendar, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSecureCommissionInfo } from '@/hooks/useSecureCommissionInfo';
import { useAuth } from '@/contexts/AuthContext';

interface SecureCommissionDisplayProps {
  creatorId: string;
}

export function SecureCommissionDisplay({ creatorId }: SecureCommissionDisplayProps) {
  const { user } = useAuth();
  const { commissionInfo, isLoading, error, isAuthenticated } = useSecureCommissionInfo(creatorId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
        <div className="h-8 bg-muted rounded"></div>
        <div className="h-8 bg-muted rounded"></div>
        <div className="h-8 bg-muted rounded"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-6 space-y-4">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Lock className="h-5 w-5" />
          <span>Commission details are protected</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Sign in to view pricing, turnaround times, and availability
        </p>
        <Button variant="outline" size="sm" onClick={() => window.location.href = '/login'}>
          Sign In to View Details
        </Button>
      </div>
    );
  }

  if (error || !commissionInfo) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">Commission information unavailable</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-green-600" />
        <span className="text-sm">
          Starting from ${commissionInfo.commission_base_rate || 0}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-blue-600" />
        <span className="text-sm">
          {commissionInfo.commission_turnaround_days || 7} days turnaround
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-purple-600" />
        <span className="text-sm">
          {commissionInfo.commission_slots_available || 0} slots available
        </span>
      </div>
    </div>
  );
}