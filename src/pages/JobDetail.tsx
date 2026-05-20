import { useParams, Link } from 'react-router-dom';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useJobListing } from '@/hooks/useJobs';
import { JobApplicationDialog } from '@/components/jobs/JobApplicationDialog';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, DollarSign, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function JobDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const { user } = useAuth();
  const { data: listing, isLoading } = useJobListing(jobId || '') as { data: any; isLoading: boolean };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-40 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!listing) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Job listing not found.</p>
          <Button asChild variant="link"><Link to="/jobs">Back to Jobs</Link></Button>
        </div>
      </MainLayout>
    );
  }

  const budgetDisplay = () => {
    if (listing.budget_min && listing.budget_max) return `$${listing.budget_min} - $${listing.budget_max}`;
    if (listing.budget_min) return `From $${listing.budget_min}`;
    if (listing.budget_max) return `Up to $${listing.budget_max}`;
    return 'Negotiable';
  };

  return (
    <MainLayout fullWidth>
      <div className="max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" asChild>
          <Link to="/jobs"><ArrowLeft className="h-4 w-4 mr-2" />Back to Jobs</Link>
        </Button>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold">{listing.title}</h1>
            <Badge variant="outline">{listing.category}</Badge>
            <Badge variant="secondary" className="capitalize">{listing.budget_type}</Badge>
          </div>
          <div className="flex items-center gap-x-4 gap-y-1 text-sm text-muted-foreground flex-wrap">
            <span>Posted by {listing.users?.username || 'Unknown'}</span>
            <span className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />{budgetDisplay()}
            </span>
            {listing.deadline && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />Due {format(new Date(listing.deadline), 'MMM d, yyyy')}
              </span>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            {listing.description && (
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="whitespace-pre-wrap">{listing.description}</p>
              </div>
            )}
            {listing.requirements && (
              <div>
                <h3 className="font-semibold mb-2">Requirements</h3>
                <p className="whitespace-pre-wrap">{listing.requirements}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact info — visible to signed-in users only */}
        {listing.contact_info && (
          user ? (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 flex items-start gap-3">
                <MessageCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold mb-0.5">How to reach the poster</p>
                  <p className="text-sm text-muted-foreground">{listing.contact_info}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">Sign in to view contact details</p>
                <Button asChild size="sm" variant="outline">
                  <Link to={`/login?returnTo=/jobs/${jobId}`}>Log in</Link>
                </Button>
              </CardContent>
            </Card>
          )
        )}

        <JobApplicationDialog listingId={listing.id} jobTitle={listing.title} />
      </div>
    </MainLayout>
  );
}
