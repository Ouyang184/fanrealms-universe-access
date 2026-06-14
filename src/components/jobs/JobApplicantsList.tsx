import { useJobApplications, useUpdateApplicationStatus } from '@/hooks/useJobs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { safeHref } from '@/lib/safeHref';

interface JobApplicantsListProps {
  listingId: string;
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  accepted: 'default',
  rejected: 'destructive',
};

export function JobApplicantsList({ listingId }: JobApplicantsListProps) {
  const { data: applications, isLoading } = useJobApplications(listingId) as {
    data: any[] | undefined;
    isLoading: boolean;
  };
  const updateStatus = useUpdateApplicationStatus();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
      </div>
    );
  }

  if (!applications || applications.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4 text-center text-sm text-muted-foreground">
          No applications yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {applications.map((app) => {
        const profile = app.applicant;
        const name = profile?.display_name || profile?.username || 'Anonymous';
        return (
          <Card key={app.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    {profile?.profile_image_url && <AvatarImage src={profile.profile_image_url} alt={name} />}
                    <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{name}</p>
                    <p className="text-xs text-muted-foreground">
                      Applied {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <Badge variant={STATUS_VARIANTS[app.status] ?? 'outline'} className="capitalize">
                  {app.status}
                </Badge>
              </div>

              {app.cover_letter && (
                <p className="text-sm whitespace-pre-wrap text-foreground/90">{app.cover_letter}</p>
              )}

              {app.portfolio_url && (
                <a
                  href={safeHref(app.portfolio_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Portfolio
                </a>
              )}

              {app.status === 'pending' && (
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    disabled={updateStatus.isPending}
                    onClick={() =>
                      updateStatus.mutate({ applicationId: app.id, listingId, status: 'accepted' })
                    }
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={updateStatus.isPending}
                    onClick={() =>
                      updateStatus.mutate({ applicationId: app.id, listingId, status: 'rejected' })
                    }
                  >
                    Reject
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
