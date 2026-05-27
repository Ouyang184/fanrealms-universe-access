import { useParams, Link } from 'react-router-dom';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useJobListing, useJobApplications, useUpdateApplicationStatus } from '@/hooks/useJobs';
import { JobApplicationDialog } from '@/components/jobs/JobApplicationDialog';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, DollarSign, MessageCircle, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_OPTIONS = ['pending', 'reviewed', 'accepted', 'rejected'] as const;

const STATUS_STYLES: Record<string, string> = {
  pending:  'bg-yellow-100 text-yellow-800',
  reviewed: 'bg-blue-100 text-blue-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-600',
};

export default function JobDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const { user } = useAuth();
  const { data: listing, isLoading } = useJobListing(jobId || '') as { data: any; isLoading: boolean };
  const isPoster = !!user && !!listing && listing.poster_id === user.id;
  const { data: applications = [], isLoading: appsLoading } = useJobApplications(isPoster ? (jobId || '') : '');
  const updateStatus = useUpdateApplicationStatus();

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

        {/* Apply button — shown to non-poster signed-in users */}
        {!isPoster && <JobApplicationDialog listingId={listing.id} jobTitle={listing.title} />}

        {/* Applications section — visible to job poster only */}
        {isPoster && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-[#111]">
                Applications{' '}
                {!appsLoading && (
                  <span className="text-[#aaa] font-normal text-[13px]">
                    ({(applications as any[]).length})
                  </span>
                )}
              </h2>
            </div>

            {appsLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
              </div>
            ) : (applications as any[]).length === 0 ? (
              <div className="border border-dashed border-[#e5e5e5] rounded-xl p-10 text-center">
                <p className="text-[14px] font-semibold text-[#111] mb-1">No applications yet</p>
                <p className="text-[13px] text-[#999]">Applications will appear here once people apply.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(applications as any[]).map((app: any) => (
                  <Card key={app.id} className="border border-[#eee]">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[13px] font-semibold text-[#111]">
                            {app.applicant?.display_name || app.applicant?.username || 'Unknown applicant'}
                          </p>
                          <p className="text-[11px] text-[#999]">
                            Applied {format(new Date(app.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <select
                          value={app.status}
                          onChange={e => updateStatus.mutate({
                            applicationId: app.id,
                            listingId: listing.id,
                            status: e.target.value,
                          })}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer outline-none ${STATUS_STYLES[app.status] ?? 'bg-gray-100 text-gray-600'}`}
                        >
                          {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s} className="bg-white text-[#111]">
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {app.cover_letter && (
                        <p className="text-[13px] text-[#444] whitespace-pre-wrap border-t border-[#f5f5f5] pt-2">
                          {app.cover_letter}
                        </p>
                      )}

                      {app.portfolio_url && (
                        <a
                          href={app.portfolio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View portfolio
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
